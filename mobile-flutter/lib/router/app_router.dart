import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../auth/auth_provider.dart';
import '../screens/login_screen.dart';
import '../screens/dashboard_screen.dart';
import '../screens/leave_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/payroll_screen.dart';
import '../screens/staff_screen.dart';
import '../screens/recruitment_screen.dart';
import '../screens/performance_screen.dart';
import '../screens/assets_screen.dart';
import '../screens/company_screen.dart';
import '../screens/training_screen.dart';
import '../screens/documents_screen.dart';
import '../screens/organization_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/travel_screen.dart';
import '../screens/attendance_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isLoading = authState.isLoading;
      final isLoginRoute = state.matchedLocation == '/login';

      if (isLoading) return null;

      if (!isAuthenticated && !isLoginRoute) {
        return '/login';
      }

      if (isAuthenticated && isLoginRoute) {
        return '/';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => MainScaffold(child: child),
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/leave',
            builder: (context, state) => const LeaveScreen(),
          ),
          GoRoute(
            path: '/more',
            builder: (context, state) => const MoreScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/payroll',
        builder: (context, state) => const PayrollScreen(),
      ),
      GoRoute(
        path: '/staff',
        builder: (context, state) => const StaffScreen(),
      ),
      GoRoute(
        path: '/recruitment',
        builder: (context, state) => const RecruitmentScreen(),
      ),
      GoRoute(
        path: '/performance',
        builder: (context, state) => const PerformanceScreen(),
      ),
      GoRoute(
        path: '/assets',
        builder: (context, state) => const AssetsScreen(),
      ),
      GoRoute(
        path: '/company',
        builder: (context, state) => const CompanyScreen(),
      ),
      GoRoute(
        path: '/training',
        builder: (context, state) => const TrainingScreen(),
      ),
      GoRoute(
        path: '/documents',
        builder: (context, state) => const DocumentsScreen(),
      ),
      GoRoute(
        path: '/organization',
        builder: (context, state) => const OrganizationScreen(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/travel',
        builder: (context, state) => const TravelScreen(),
      ),
      GoRoute(
        path: '/attendance',
        builder: (context, state) => const AttendanceScreen(),
      ),
    ],
  );
});

class MoreScreen extends ConsumerWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final isAdmin = user?.role == 'administrator' || user?.role == 'hr_officer';

    final modules = [
      {
        'name': 'Attendance',
        'icon': Icons.access_time,
        'route': '/attendance',
        'admin': false
      },
      {
        'name': 'Payroll',
        'icon': Icons.attach_money,
        'route': '/payroll',
        'admin': false
      },
      {
        'name': 'Staff Directory',
        'icon': Icons.people,
        'route': '/staff',
        'admin': false
      },
      {
        'name': 'Performance',
        'icon': Icons.trending_up,
        'route': '/performance',
        'admin': false
      },
      {
        'name': 'Training',
        'icon': Icons.school,
        'route': '/training',
        'admin': false
      },
      {
        'name': 'Assets',
        'icon': Icons.inventory,
        'route': '/assets',
        'admin': false
      },
      {
        'name': 'Documents',
        'icon': Icons.description,
        'route': '/documents',
        'admin': false
      },
      {
        'name': 'Company',
        'icon': Icons.business,
        'route': '/company',
        'admin': false
      },
      {
        'name': 'Travel',
        'icon': Icons.flight,
        'route': '/travel',
        'admin': false
      },
      {
        'name': 'Organization',
        'icon': Icons.account_tree,
        'route': '/organization',
        'admin': false
      },
      {
        'name': 'Recruitment',
        'icon': Icons.person_add,
        'route': '/recruitment',
        'admin': true
      },
      {
        'name': 'Settings',
        'icon': Icons.settings,
        'route': '/settings',
        'admin': false
      },
    ];

    final visibleModules =
        modules.where((m) => !(m['admin'] as bool) || isAdmin).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('All Modules'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
      ),
      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.2,
        ),
        itemCount: visibleModules.length,
        itemBuilder: (context, index) {
          final module = visibleModules[index];
          return Card(
            child: InkWell(
              onTap: () => context.push(module['route'] as String),
              borderRadius: BorderRadius.circular(12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    module['icon'] as IconData,
                    size: 40,
                    color: const Color(0xFF2563EB),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    module['name'] as String,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class MainScaffold extends StatefulWidget {
  final Widget child;

  const MainScaffold({super.key, required this.child});

  @override
  State<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends State<MainScaffold> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        type: BottomNavigationBarType.fixed,
        onTap: (index) {
          setState(() => _currentIndex = index);
          switch (index) {
            case 0:
              context.go('/');
              break;
            case 1:
              context.go('/leave');
              break;
            case 2:
              context.go('/more');
              break;
            case 3:
              context.go('/profile');
              break;
          }
        },
        selectedItemColor: const Color(0xFF2563EB),
        unselectedItemColor: const Color(0xFF6B7280),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_today),
            label: 'Leave',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.apps),
            label: 'More',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
