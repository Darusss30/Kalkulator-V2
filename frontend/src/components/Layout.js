import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Menu, 
  X, 
  Home, 
  Calculator, 
  Search,
  Clock,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Shield,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, getUserDisplayName, getUserInitials } = useAuth();
  
  // Navigation items (dynamic based on authentication)
  const navigationItems = [
    {
      name: 'Beranda',
      href: '/',
      icon: Home,
      description: 'Kategori pekerjaan konstruksi',
    },
    {
      name: 'Kalkulator',
      href: '/calculators',
      icon: Calculator,
      description: 'Kalkulator panjang, luas, dan volume',
      submenu: [
        {
          name: 'Kalkulator Panjang',
          href: '/length-calculator',
          description: 'Hitung biaya berdasarkan panjang'
        },
        {
          name: 'Kalkulator Luas',
          href: '/area-calculator',
          description: 'Hitung biaya berdasarkan luas'
        },
        {
          name: 'Kalkulator Volume',
          href: '/volume-calculator',
          description: 'Hitung biaya berdasarkan volume'
        },
        {
          name: 'Kalkulator Struktur',
          href: '/beam-calculator',
          description: 'Hitung biaya balok struktur beton bertulang'
        },
        {
          name: 'Kalkulator Footplate',
          href: '/footplate-calculator',
          description: 'Hitung biaya footplate beton bertulang'
        }
      ]
    },
    {
      name: 'History',
      href: '/history',
      icon: Clock,
      description: 'Riwayat perhitungan Anda',
    },
    ...(isAuthenticated && user?.role === 'admin' ? [{
      name: 'Admin',
      href: '/admin',
      icon: Settings,
      description: 'Panel administrasi',
    }] : []),
  ];
  
  // Check if current path is active
  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Toggle submenu
  const toggleSubmenu = (itemName) => {
    setExpandedMenus(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  // Check if submenu should be expanded
  const isSubmenuExpanded = (itemName) => {
    return expandedMenus[itemName] || false;
  };
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSidebarOpen(false);
    }
  };

  // Handle user menu toggle
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };
  
  return (
    <>
      <Helmet>
        <title>
          {location.pathname === '/' 
            ? 'Darus Sakinah Construction Calculator'
            : `${document.title} - Darus Sakinah`
          }
        </title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Mobile Sidebar - Show on mobile and tablet */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-full xxs:w-72 xs:w-80 sm:w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 xxs:h-18 sm:h-20 px-4 xxs:px-5 sm:px-6 border-b border-gray-200">
              <Link to="/" className="flex items-center space-x-2 xxs:space-x-3 sm:space-x-3 min-w-0 flex-1">
                <div className="w-8 h-8 xxs:w-9 xxs:h-9 sm:w-10 sm:h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-4 h-4 xxs:w-4.5 xxs:h-4.5 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-sm xxs:text-base sm:text-lg font-bold text-gray-900 truncate">
                  Darus Sakinah
                </span>
              </Link>
              
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 xxs:p-2.5 rounded-md hover:bg-gray-100 touch-manipulation flex-shrink-0"
                aria-label="Tutup menu"
              >
                <X className="w-5 h-5 xxs:w-5.5 xxs:h-5.5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            {/* Search */}
            <div className="p-4 xxs:p-5 sm:p-6 border-b border-gray-200">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 xxs:left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 xxs:w-4.5 xxs:h-4.5 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari kategori atau pekerjaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 xxs:pl-11 sm:pl-12 pr-4 py-3 xxs:py-3.5 sm:py-4 text-sm xxs:text-base sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 touch-manipulation"
                  autoComplete="off"
                />
              </form>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-4 xxs:px-5 sm:px-6 py-4 xxs:py-5 sm:py-6 space-y-2 overflow-y-auto mobile-hide-scrollbar">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.href);
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isExpanded = isSubmenuExpanded(item.name);
                
                return (
                  <div key={item.name}>
                    {hasSubmenu ? (
                      <button
                        onClick={() => toggleSubmenu(item.name)}
                        className={`
                          flex items-center w-full px-3 xxs:px-3.5 sm:px-4 py-3 xxs:py-3.5 sm:py-4 text-sm xxs:text-base sm:text-base font-medium rounded-lg transition-all duration-200 touch-manipulation
                          ${isActive
                            ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5 xxs:w-5.5 xxs:h-5.5 sm:w-6 sm:h-6 mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{item.name}</div>
                          <div className="text-xs xxs:text-sm sm:text-sm opacity-75 mt-1 truncate">{item.description}</div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 flex-shrink-0" />
                        )}
                      </button>
                    ) : (
                      <Link
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center px-3 xxs:px-3.5 sm:px-4 py-3 xxs:py-3.5 sm:py-4 text-sm xxs:text-base sm:text-base font-medium rounded-lg transition-all duration-200 touch-manipulation
                          ${isActive
                            ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5 xxs:w-5.5 xxs:h-5.5 sm:w-6 sm:h-6 mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{item.name}</div>
                          <div className="text-xs xxs:text-sm sm:text-sm opacity-75 mt-1 truncate">{item.description}</div>
                        </div>
                      </Link>
                    )}
                    
                    {/* Submenu */}
                    {hasSubmenu && isExpanded && (
                      <div className="ml-6 mt-2 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.name}
                            to={subItem.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 touch-manipulation
                              ${isActivePath(subItem.href)
                                ? 'bg-primary-50 text-primary-600 border-l-2 border-primary-600'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }
                            `}
                          >
                            <Calculator className="w-4 h-4 mr-2 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{subItem.name}</div>
                              <div className="text-xs opacity-75 mt-0.5 truncate">{subItem.description}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
            
            {/* User section */}
            <div className="p-4 xxs:p-5 sm:p-6 border-t border-gray-200">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-lg">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-sm font-medium text-primary-700">
                      {getUserInitials()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-primary-900 truncate">{getUserDisplayName()}</p>
                      <p className="text-xs text-primary-700 truncate">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Link
                      to="/profile"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Profil</span>
                    </Link>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setSidebarOpen(false);
                      }}
                      className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 xxs:p-3.5 sm:p-4 bg-primary-50 rounded-lg">
                    <h4 className="text-sm xxs:text-base sm:text-base font-medium text-primary-900 mb-2">
                      Kalkulator Konstruksi
                    </h4>
                    <p className="text-xs xxs:text-sm sm:text-sm text-primary-700 leading-relaxed">
                      Kalkulator ini dapat digunakan langsung tanpa registrasi atau login.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center justify-center space-x-2 w-full px-4 py-3 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Masuk</span>
                    </Link>
                    
                    <Link
                      to="/register"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center justify-center space-x-2 w-full px-4 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Daftar</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Top Navigation Bar - Always visible */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 lg:relative safe-area-inset-top">
          <div className="container-responsive">
            <div className="flex items-center justify-between h-14 xxs:h-15 sm:h-16 lg:h-20">
              <div className="flex items-center space-x-2 xxs:space-x-3 sm:space-x-4 min-w-0 flex-1">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 xxs:p-2.5 sm:p-3 rounded-md hover:bg-gray-100 active:bg-gray-200 lg:hidden touch-manipulation flex-shrink-0"
                  aria-label="Buka menu"
                >
                  <Menu className="w-5 h-5 xxs:w-5.5 xxs:h-5.5 sm:w-6 sm:h-6" />
                </button>
                
                <Link to="/" className="flex items-center space-x-2 xxs:space-x-2.5 sm:space-x-3 min-w-0 flex-1">
                  <div className="w-8 h-8 xxs:w-9 xxs:h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calculator className="w-4 h-4 xxs:w-4.5 xxs:h-4.5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm xxs:text-base sm:text-lg lg:text-xl font-bold text-gray-900 hidden xxs:block truncate">
                      Darus Sakinah
                    </span>
                    <span className="text-xs font-bold text-gray-900 xxs:hidden">
                      DS
                    </span>
                  </div>
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-6 xl:space-x-8 flex-shrink-0">
                <nav className="flex items-center space-x-6 xl:space-x-8">
                  <Link 
                    to="/" 
                    className={`text-sm xl:text-base font-medium transition-colors duration-200 hover:scale-105 transform ${
                      location.pathname === '/' 
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Beranda
                  </Link>
                  <Link 
                    to="/history" 
                    className={`text-sm xl:text-base font-medium transition-colors duration-200 hover:scale-105 transform ${
                      location.pathname === '/history' 
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    History
                  </Link>
                  {isAuthenticated && user?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className={`text-sm xl:text-base font-medium transition-colors duration-200 hover:scale-105 transform ${
                        location.pathname === '/admin' 
                          ? 'text-primary-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Admin
                    </Link>
                  )}
                </nav>

                {/* User Menu */}
                {isAuthenticated ? (
                  <div className="relative">
                    <button
                      onClick={toggleUserMenu}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-medium text-primary-700">
                        {getUserInitials()}
                      </div>
                      <span className="text-sm font-medium">{getUserDisplayName()}</span>
                    </button>

                    {/* User Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Profil</span>
                        </Link>
                        {user?.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Keluar</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link
                      to="/login"
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Masuk</span>
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Daftar</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content - Full width with safe area support */}
        <main className="flex-1 safe-area-inset-bottom">
          <div className="min-h-screen-mobile sm:min-h-screen-tablet lg:min-h-screen-desktop">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
};

export default Layout;
