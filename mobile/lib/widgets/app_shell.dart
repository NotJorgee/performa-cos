import 'package:flutter/material.dart';

import '../state/app_state.dart';
import '../theme.dart';
import 'common.dart';
import 'confirm_dialog.dart';

/// Authenticated COS Employee shell (port of layout/AppLayout.jsx): off-canvas drawer,
/// top bar with role pill, notification bell + dropdown and user chip.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final user = state.user!;
    final width = MediaQuery.sizeOf(context).width;

    return PopScope(
      canPop: state.currentView == 'dashboard',
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) state.goBack();
      },
      child: Scaffold(
        drawer: const _NavDrawer(),
        appBar: AppBar(
          titleSpacing: 0,
          leading: Builder(
            builder: (ctx) => IconButton(
              tooltip: 'Open Navigation Menu',
              icon: const Icon(Icons.menu),
              onPressed: () => Scaffold.of(ctx).openDrawer(),
            ),
          ),
          title: Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: AppColors.brand50,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: AppColors.brandBorder),
              ),
              child: Text(user.role,
                  style: const TextStyle(
                      fontSize: 11.5, fontWeight: FontWeight.w700, color: AppColors.brand700)),
            ),
          ]),
          actions: [
            _BellButton(unread: state.unreadCount),
            Padding(
              padding: const EdgeInsets.only(right: 12, left: 4),
              child: Row(children: [
                UserAvatar(initials: user.initials, url: user.avatarUrl, size: 34),
                if (width > 520) ...[
                  const SizedBox(width: 8),
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user.fullName,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                      const Text('Eastern Visayas State University',
                          style: TextStyle(fontSize: 11, color: AppColors.ink500)),
                    ],
                  ),
                ],
              ]),
            ),
          ],
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(1),
            child: Divider(height: 1, thickness: 1, color: AppColors.line),
          ),
        ),
        body: SafeArea(top: false, child: child),
      ),
    );
  }
}

class _BellButton extends StatelessWidget {
  const _BellButton({required this.unread});
  final int unread;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'Notifications ($unread unread)',
      onPressed: () => _showNotificationsPanel(context),
      icon: Badge(
        isLabelVisible: unread > 0,
        label: Text('$unread'),
        backgroundColor: AppColors.red600,
        child: const Icon(Icons.notifications_none),
      ),
    );
  }
}

void _showNotificationsPanel(BuildContext context) {
  final state = AppScope.read(context);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: AppColors.white,
      builder: (sheetCtx) => AppScope(
        state: state,
        child: Builder(builder: (ctx) {
          final s = AppScope.of(ctx);
          final list = s.notifications;
          return ConstrainedBox(
            constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(ctx).height * 0.7),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 0, 18, 10),
                  child: Row(children: [
                    const Text('Notifications', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    const Spacer(),
                    s.unreadCount > 0
                        ? StatusBadge.tone('${s.unreadCount} New', 'completed')
                        : const MutedText('All caught up', size: 12),
                  ]),
                ),
                const Divider(height: 1),
                Flexible(
                  child: list.isEmpty
                      ? const Padding(
                          padding: EdgeInsets.all(28),
                          child: MutedText('No notifications yet.', align: TextAlign.center),
                        )
                      : ListView.separated(
                          shrinkWrap: true,
                          itemCount: list.length,
                          separatorBuilder: (_, _) => const Divider(height: 1),
                          itemBuilder: (_, i) {
                            final n = list[i];
                            final unread = n['unread'] == true;
                            return InkWell(
                              onTap: () {
                                s.markAsRead((n['id'] as num).toInt());
                                final view = n['actionView'] as String?;
                                if (view != null && view.isNotEmpty) {
                                  Navigator.pop(sheetCtx);
                                  s.navigate(view);
                                }
                              },
                              child: Container(
                                color: unread ? const Color(0xFFFDF6F8) : null,
                                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Container(
                                    margin: const EdgeInsets.only(top: 5, right: 10),
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: unread ? AppColors.brand600 : AppColors.ink300),
                                  ),
                                  Expanded(
                                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Text('${n['title'] ?? ''}',
                                          style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: unread ? FontWeight.w700 : FontWeight.w500)),
                                      const SizedBox(height: 2),
                                      MutedText('${n['message'] ?? ''}', size: 12),
                                      const SizedBox(height: 4),
                                      Row(children: [
                                        MutedText('${n['time'] ?? ''}', size: 11),
                                        const Spacer(),
                                        if (n['actionLabel'] != null)
                                          Text('${n['actionLabel']} →',
                                              style: const TextStyle(
                                                  fontSize: 11.5,
                                                  color: AppColors.brand700,
                                                  fontWeight: FontWeight.w600)),
                                      ]),
                                    ]),
                                  ),
                                ]),
                              ),
                            );
                          },
                        ),
                ),
                if (s.unreadCount > 0) const Divider(height: 1),
                if (s.unreadCount > 0)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    child: Row(children: [
                      TextButton(onPressed: s.markAllAsRead, child: const Text('Mark all as read')),
                    ]),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }

class _NavDrawer extends StatelessWidget {
  const _NavDrawer();

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final path = state.currentView;

    Widget item(IconData icon, String label, String view, List<String> activeOn) {
      final active = activeOn.contains(path);
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
        child: ListTile(
          dense: true,
          selected: active,
          selectedTileColor: AppColors.brand50,
          selectedColor: AppColors.brand700,
          iconColor: AppColors.ink700,
          textColor: AppColors.ink800,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          leading: Icon(icon, size: 20),
          title: Text(label, style: TextStyle(fontSize: 14, fontWeight: active ? FontWeight.w700 : FontWeight.w600)),
          onTap: () {
            Navigator.pop(context);
            state.navigate(view);
          },
        ),
      );
    }

    return Drawer(
      backgroundColor: AppColors.white,
      width: 290,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 16, 8, 16),
              child: Row(children: [
                Image.asset('assets/images/evsu-seal.png', width: 40, height: 40),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('PerformaCOS', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    Text('EVSU PERFORMANCE MANAGEMENT',
                        style: TextStyle(
                            fontSize: 10.5,
                            letterSpacing: 0.6,
                            color: AppColors.ink500,
                            fontWeight: FontWeight.w700)),
                  ]),
                ),
                IconButton(
                  tooltip: 'Close navigation menu',
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: AppColors.ink500),
                ),
              ]),
            ),
            const Divider(height: 1),
            const SizedBox(height: 8),
            Expanded(
              child: ListView(
                children: [
                  item(Icons.dashboard_outlined, 'Dashboard', 'dashboard', ['dashboard']),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                    child: ListTile(
                      dense: true,
                      iconColor: AppColors.ink700,
                      textColor: AppColors.ink800,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      leading: const Icon(Icons.notifications_none_outlined, size: 20),
                      title: const Text('Notifications', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      trailing: state.unreadCount > 0
                          ? Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEF2F2),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: const Color(0xFFFECACA)),
                              ),
                              child: Text(
                                '${state.unreadCount}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFFDC2626),
                                ),
                              ),
                            )
                          : null,
                      onTap: () {
                        Navigator.pop(context);
                        _showNotificationsPanel(context);
                      },
                    ),
                  ),
                  item(Icons.settings_outlined, 'Account Settings', 'account_settings',
                      ['account_settings', 'profile_settings', 'view_profile', 'change_password']),
                ],
              ),
            ),
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(10),
              child: ListTile(
                dense: true,
                iconColor: AppColors.brand700,
                textColor: AppColors.brand700,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                leading: const Icon(Icons.logout, size: 20),
                title: const Text('Logout', style: TextStyle(fontWeight: FontWeight.w700)),
                onTap: () async {
                  Navigator.pop(context);
                  final confirmed = await showConfirmDialog(
                    context,
                    title: 'Log Out of PerformaCOS?',
                    message:
                        'Are you sure you want to end your current session? Any unsaved edits or in-progress drafts will be lost.',
                    confirmText: 'Log Out',
                    cancelText: 'Stay Logged In',
                    variant: 'brand',
                    icon: Icons.logout,
                  );
                  if (confirmed) {
                    state.logout();
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Standard scrollable page body with phone-friendly padding.
class PageBody extends StatelessWidget {
  const PageBody({super.key, required this.children, this.onRefresh, this.maxWidth = 900});
  final List<Widget> children;
  final Future<void> Function()? onRefresh;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    final list = ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 32),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxWidth),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: children),
          ),
        ),
      ],
    );
    if (onRefresh == null) return list;
    return RefreshIndicator(color: AppColors.brand600, onRefresh: onRefresh!, child: list);
  }
}
