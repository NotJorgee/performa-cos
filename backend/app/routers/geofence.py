"""
routers/geofence.py — Multi-Campus Geofencing Engine, GIS spatial configuration & verification logs.
"""
import math
import datetime
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..auth import get_current_user
from .audit import log_audit

router = APIRouter(prefix="/api/geofences", tags=["Campus Geofence Engine"])


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class CampusGeofenceBase(BaseModel):
    id: str
    name: str
    shortName: Optional[str] = None
    locationNote: Optional[str] = None
    latitude: float
    longitude: float
    radiusM: float
    boundaryType: Optional[str] = "radius"  # 'radius' | 'polygon'
    polygonCoords: Optional[List[List[float]]] = None
    enforceGeofence: bool = True
    isPrimary: bool = False

    class Config:
        from_attributes = True


class CampusGeofenceCreate(BaseModel):
    id: Optional[str] = None
    name: str
    shortName: Optional[str] = None
    locationNote: Optional[str] = None
    latitude: float
    longitude: float
    radiusM: float
    boundaryType: Optional[str] = "radius"
    polygonCoords: Optional[List[List[float]]] = None
    enforceGeofence: bool = True
    isPrimary: bool = False


class VerificationLogOut(BaseModel):
    id: int
    name: str
    department: str
    campusSite: str
    time: str
    rawTime: Optional[str] = None
    coordinates: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance: str
    distanceMeters: float
    status: str
    isValid: bool


# ---------------------------------------------------------------------------
# Haversine & Ray-Casting Polygon Calculation Helpers
# ---------------------------------------------------------------------------
def calculate_haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance in meters between two GPS coordinates."""
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def is_point_in_polygon(lat: float, lon: float, polygon: Optional[List[List[float]]]) -> bool:
    """Ray-casting algorithm for 2D Point-in-Polygon check."""
    if not polygon or len(polygon) < 3:
        return False
    inside = False
    n = len(polygon)
    p1x, p1y = polygon[0][0], polygon[0][1]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n][0], polygon[i % n][1]
        if (lon > min(p1y, p2y)) and (lon <= max(p1y, p2y)) and (lat <= max(p1x, p2x)):
            if p1y != p2y:
                xinters = (lon - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
            if p1x == p2x or lat <= xinters:
                inside = not inside
        p1x, p1y = p2x, p2y
    return inside


# ---------------------------------------------------------------------------
# Default Campuses Seeder
# ---------------------------------------------------------------------------
DEFAULT_MAIN_POLYGON = [
    [11.0085, 124.6058],
    [11.0088, 124.6090],
    [11.0052, 124.6095],
    [11.0046, 124.6065],
    [11.0060, 124.6050],
]

DEFAULT_LUNA_POLYGON = [
    [11.0625, 124.6120],
    [11.0628, 124.6152],
    [11.0592, 124.6155],
    [11.0588, 124.6122],
]

DEFAULT_CAMPUSES_SEED = [
    {
        "id": "evsu_ormoc_main",
        "name": "EVSU Ormoc — Main Campus",
        "short_name": "Main Campus",
        "location_note": "Brgy. Don Felipe Larrazabal, Ormoc City",
        "latitude": 11.0065,
        "longitude": 124.6075,
        "radius_meters": 500.0,
        "boundary_type": "radius",
        "polygon_coords": DEFAULT_MAIN_POLYGON,
        "enforce_geofence": True,
        "is_primary": True,
    },
    {
        "id": "evsu_luna",
        "name": "EVSU Ormoc — Luna Campus",
        "short_name": "Luna Campus",
        "location_note": "Barangay Luna, Ormoc City",
        "latitude": 11.0607,
        "longitude": 124.6137,
        "radius_meters": 500.0,
        "boundary_type": "radius",
        "polygon_coords": DEFAULT_LUNA_POLYGON,
        "enforce_geofence": True,
        "is_primary": False,
    },
]


def ensure_default_campuses(db: Session):
    """Ensures at least default Main and Luna campuses exist in DB."""
    count = db.query(models.CampusGeofence).count()
    if count == 0:
        for seed in DEFAULT_CAMPUSES_SEED:
            campus = models.CampusGeofence(**seed)
            db.add(campus)
        db.commit()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get("", response_model=List[CampusGeofenceBase])
def get_campus_geofences(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Returns list of configured campus geofences.
    """
    ensure_default_campuses(db)
    campuses = db.query(models.CampusGeofence).order_by(models.CampusGeofence.is_primary.desc(), models.CampusGeofence.id).all()
    
    result = []
    for c in campuses:
        fallback_poly = DEFAULT_MAIN_POLYGON if "main" in c.id.lower() else DEFAULT_LUNA_POLYGON
        result.append(
            CampusGeofenceBase(
                id=c.id,
                name=c.name,
                shortName=c.short_name or c.name,
                locationNote=c.location_note or "",
                latitude=c.latitude,
                longitude=c.longitude,
                radiusM=c.radius_meters,
                boundaryType=c.boundary_type or "radius",
                polygonCoords=c.polygon_coords or fallback_poly,
                enforceGeofence=c.enforce_geofence,
                isPrimary=c.is_primary,
            )
        )
    return result


@router.put("/batch", response_model=List[CampusGeofenceBase])
def update_campus_geofences_batch(
    payload: List[CampusGeofenceBase],
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Updates or synchronizes full list of campus geofences. Admin/HR/DeptHead only.
    """
    if current_user.role not in ["HR Personnel", "Department Head"]:
        raise HTTPException(status_code=403, detail="Only HR Personnel or Department Heads can configure geofences.")

    incoming_ids = set()
    for item in payload:
        incoming_ids.add(item.id)
        existing = db.query(models.CampusGeofence).filter(models.CampusGeofence.id == item.id).first()
        if existing:
            existing.name = item.name
            existing.short_name = item.shortName
            existing.location_note = item.locationNote
            existing.latitude = item.latitude
            existing.longitude = item.longitude
            existing.radius_meters = item.radiusM
            existing.boundary_type = item.boundaryType or "radius"
            existing.polygon_coords = item.polygonCoords
            existing.enforce_geofence = item.enforceGeofence
            existing.is_primary = item.isPrimary
        else:
            new_campus = models.CampusGeofence(
                id=item.id,
                name=item.name,
                short_name=item.shortName,
                location_note=item.locationNote,
                latitude=item.latitude,
                longitude=item.longitude,
                radius_meters=item.radiusM,
                boundary_type=item.boundaryType or "radius",
                polygon_coords=item.polygonCoords,
                enforce_geofence=item.enforceGeofence,
                is_primary=item.isPrimary,
            )
            db.add(new_campus)

    # Remove any campuses no longer in list (if not primary)
    db.query(models.CampusGeofence).filter(
        ~models.CampusGeofence.id.in_(incoming_ids),
        models.CampusGeofence.is_primary == False
    ).delete(synchronize_session=False)

    db.commit()

    log_audit(
        db=db,
        action="UPDATE_CAMPUS_GEOFENCE",
        target_scope="GIS Spatial Engine",
        details=f"{current_user.full_name} synchronized {len(payload)} campus geofences with active radius configurations.",
        user=current_user,
    )

    return get_campus_geofences(db=db, current_user=current_user)


@router.put("/{campus_id}", response_model=CampusGeofenceBase)
def update_single_geofence(
    campus_id: str,
    payload: CampusGeofenceCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Updates parameters (coordinates, radius, enforcement) for a specific campus.
    """
    if current_user.role not in ["HR Personnel", "Department Head"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit geofence perimeters.")

    campus = db.query(models.CampusGeofence).filter(models.CampusGeofence.id == campus_id).first()
    if not campus:
        # Create if doesn't exist
        campus = models.CampusGeofence(
            id=campus_id,
            name=payload.name,
            short_name=payload.shortName,
            location_note=payload.locationNote,
            latitude=payload.latitude,
            longitude=payload.longitude,
            radius_meters=payload.radiusM,
            boundary_type=payload.boundaryType or "radius",
            polygon_coords=payload.polygonCoords,
            enforce_geofence=payload.enforceGeofence,
            is_primary=payload.isPrimary,
        )
        db.add(campus)
    else:
        campus.name = payload.name
        campus.short_name = payload.shortName or payload.name
        campus.location_note = payload.locationNote
        campus.latitude = payload.latitude
        campus.longitude = payload.longitude
        campus.radius_meters = payload.radiusM
        if payload.boundaryType:
            campus.boundary_type = payload.boundaryType
        if payload.polygonCoords is not None:
            campus.polygon_coords = payload.polygonCoords
        campus.enforce_geofence = payload.enforceGeofence

    db.commit()
    db.refresh(campus)

    log_audit(
        db=db,
        action="UPDATE_CAMPUS_GEOFENCE",
        target_scope=campus.name,
        details=f"Updated geofence for {campus.name}: Lat {campus.latitude}, Lng {campus.longitude}, Type={campus.boundary_type}, Radius={campus.radius_meters}m, Enforce={campus.enforce_geofence}",
        user=current_user,
    )

    fallback_poly = DEFAULT_MAIN_POLYGON if "main" in campus.id.lower() else DEFAULT_LUNA_POLYGON
    return CampusGeofenceBase(
        id=campus.id,
        name=campus.name,
        shortName=campus.short_name,
        locationNote=campus.location_note,
        latitude=campus.latitude,
        longitude=campus.longitude,
        radiusM=campus.radius_meters,
        boundaryType=campus.boundary_type or "radius",
        polygonCoords=campus.polygon_coords or fallback_poly,
        enforceGeofence=campus.enforce_geofence,
        isPrimary=campus.is_primary,
    )


@router.delete("/{campus_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campus_geofence(
    campus_id: str,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Removes a configured campus site (cannot remove primary campus).
    """
    if current_user.role not in ["HR Personnel"]:
        raise HTTPException(status_code=403, detail="Only HR Personnel can remove campus sites.")

    campus = db.query(models.CampusGeofence).filter(models.CampusGeofence.id == campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus site not found.")
    if campus.is_primary:
        raise HTTPException(status_code=400, detail="The primary university campus cannot be deleted.")

    name = campus.name
    db.delete(campus)
    db.commit()

    log_audit(
        db=db,
        action="DELETE_CAMPUS_GEOFENCE",
        target_scope=name,
        details=f"Removed campus site '{name}' from authorized geofence perimeters.",
        user=current_user,
    )
    return None


@router.get("/verifications", response_model=List[VerificationLogOut])
def get_recent_geofence_verifications(
    campus_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """
    Returns recent Daily Accomplishment Report submissions with real GPS coordinates,
    distance to campus centroid, and verified status.
    """
    ensure_default_campuses(db)
    campuses = db.query(models.CampusGeofence).all()
    campus_map = {c.id: c for c in campuses}
    main_campus = next((c for c in campuses if c.is_primary or "main" in c.id.lower()), campuses[0] if campuses else None)
    luna_campus = next((c for c in campuses if "luna" in c.id.lower()), None)

    limit_val = int(limit.default) if hasattr(limit, "default") else int(limit or 50)
    # 1. Fetch real DAR records from database
    real_dars = (
        db.query(models.DailyAccomplishmentReport)
        .order_by(models.DailyAccomplishmentReport.created_at.desc())
        .limit(limit_val)
        .all()
    )

    logs: List[VerificationLogOut] = []

    for dar in real_dars:
        emp = dar.user
        emp_name = emp.full_name if emp else f"Employee #{dar.user_id}"
        dept_name = emp.department.name if emp and emp.department else "General Department"
        
        # Determine closest campus
        closest_campus_name = "EVSU Ormoc — Main Campus"
        min_dist = 0.0
        
        if dar.latitude and dar.longitude and campuses:
            dists = []
            for c in campuses:
                d = calculate_haversine_distance_meters(dar.latitude, dar.longitude, c.latitude, c.longitude)
                dists.append((d, c))
            dists.sort(key=lambda x: x[0])
            min_dist, closest_c = dists[0]
            closest_campus_name = closest_c.name

        coord_str = (
            f"{dar.latitude:.5f}° N, {dar.longitude:.5f}° E"
            if dar.latitude and dar.longitude
            else "GPS Unavailable"
        )
        
        time_str = dar.created_at.strftime("%b %d, %Y %I:%M %p") if dar.created_at else "Recent"

        status_label = "Verified In-Bounds" if dar.is_geofence_verified else "Out of Bounds / Flagged"

        logs.append(
            VerificationLogOut(
                id=dar.id,
                name=emp_name,
                department=dept_name,
                campusSite=closest_campus_name,
                time=time_str,
                rawTime=dar.created_at.isoformat() if dar.created_at else None,
                coordinates=coord_str,
                latitude=dar.latitude,
                longitude=dar.longitude,
                distance=f"{int(min_dist)}m from center" if min_dist > 0 else "Within perimeter",
                distanceMeters=min_dist,
                status=status_label,
                isValid=bool(dar.is_geofence_verified),
            )
        )

    return logs
