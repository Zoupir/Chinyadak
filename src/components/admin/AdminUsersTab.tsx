import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AdminUser, AdminRole, AdminPermissions } from '../../types';
import { Users, ShieldCheck, Plus, Edit3, Trash2, Lock, Check, KeyRound } from 'lucide-react';

export const AdminUsersTab: React.FC = () => {
  const { 
    adminUsers, 
    addAdminUser, 
    updateAdminUser, 
    deleteAdminUser, 
    toggleAdminStatus, 
    adminAuth,
    adminChangePassword,
    showToast
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Super Admin Password Change Form
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<AdminRole>('order_manager');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [permissions, setPermissions] = useState<AdminPermissions>({
    canManageProducts: false,
    canManageOrders: true,
    canManageArticles: false,
    canManageSliders: false,
    canManageSettings: false,
    canManageAdmins: false,
    canAccessSandbox: true,
    canManageVehicles: false
  });

  // Role preset templates
  const handleRoleChange = (selectedRole: AdminRole) => {
    setRole(selectedRole);
    switch (selectedRole) {
      case 'super_admin':
        setPermissions({
          canManageProducts: true,
          canManageOrders: true,
          canManageArticles: true,
          canManageSliders: true,
          canManageSettings: true,
          canManageAdmins: true,
          canAccessSandbox: true,
          canManageVehicles: true
        });
        break;
      case 'content_manager':
        setPermissions({
          canManageProducts: false,
          canManageOrders: false,
          canManageArticles: true,
          canManageSliders: true,
          canManageSettings: false,
          canManageAdmins: false,
          canAccessSandbox: false,
          canManageVehicles: false
        });
        break;
      case 'order_manager':
        setPermissions({
          canManageProducts: false,
          canManageOrders: true,
          canManageArticles: false,
          canManageSliders: false,
          canManageSettings: false,
          canManageAdmins: false,
          canAccessSandbox: true,
          canManageVehicles: false
        });
        break;
      case 'inventory_manager':
        setPermissions({
          canManageProducts: true,
          canManageOrders: false,
          canManageArticles: false,
          canManageSliders: false,
          canManageSettings: false,
          canManageAdmins: false,
          canAccessSandbox: false,
          canManageVehicles: true
        });
        break;
    }
  };

  const openNewUserModal = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setRole('order_manager');
    setEmail('');
    setPhone('');
    setIsActive(true);
    handleRoleChange('order_manager');
    setIsModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword('');
    setFullName(user.fullName);
    setRole(user.role);
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setIsActive(user.isActive);
    setPermissions(user.permissions);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) return;

    const getRoleTitle = (r: AdminRole) => {
      switch (r) {
        case 'super_admin': return 'مدیر کل ارشد (Super Admin)';
        case 'content_manager': return 'مدیر محتوا و بلاگ';
        case 'order_manager': return 'مدیر فروش و فاکتورها';
        case 'inventory_manager': return 'مدیر کاتالوگ و انبار';
      }
    };

    if (editingUser) {
      updateAdminUser({
        ...editingUser,
        username: username.toLowerCase().trim(),
        password: password.trim() ? password.trim() : editingUser.password,
        fullName,
        role,
        roleTitle: getRoleTitle(role),
        email,
        phone,
        isActive,
        permissions
      });
    } else {
      if (password.trim().length < 10) {
        showToast('رمز عبور اولیه مدیر باید حداقل ۱۰ کاراکتر باشد.', 'error');
        return;
      }
      const newUser: AdminUser = {
        id: `admin-${Date.now()}`,
        username: username.toLowerCase().trim(),
        password: password.trim(),
        fullName,
        role,
        roleTitle: getRoleTitle(role),
        avatar: '',
        email,
        phone,
        isActive,
        createdAt: new Date().toLocaleDateString('fa-IR'),
        permissions
      };
      addAdminUser(newUser);
    }

    setIsModalOpen(false);
  };

  const handleSuperAdminPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError('رمز عبور جدید با تکرار آن یکسان نیست.');
      return;
    }

    const res = await adminChangePassword(currentPasswordInput, newPasswordInput);
    if (!res.success) {
      setPasswordChangeError(res.error || 'خطا در تغییر رمز عبور');
      return;
    }

    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setIsPasswordChangeOpen(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-4">
        <div>
          <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            <span>مدیریت مدیران و سطوح دسترسی (Multi-Admin & Permissions)</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            تعریف مدیران مختلف برای کنترل بخش‌های فروشگاه با تفکیک دقیق وظایف (انبار، محتوا، سفارشات و فاکتورها)
          </p>
        </div>

        <button
          onClick={openNewUserModal}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف مدیر جدید</span>
        </button>
      </div>

      {/* Current Admin Notice */}
      <div className="p-4 bg-neutral-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center font-bold text-white shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold">
              مدیر جاری لاگین شده: <span className="text-red-400">{adminAuth.currentUser?.fullName || adminAuth.username}</span>
            </div>
            <span className="text-[11px] text-neutral-400">
              نقش فعال: {adminAuth.currentUser?.roleTitle || 'مدیر ارشد'} (نام کاربری: {adminAuth.username})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPasswordChangeOpen(!isPasswordChangeOpen)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isPasswordChangeOpen ? 'بستن فرم تغییر رمز' : 'تغییر رمز عبور مدیر کل'}</span>
          </button>
          <span className="text-[10px] bg-neutral-800 px-3 py-1.5 rounded-xl text-neutral-300 font-mono">
            امنیت فعال
          </span>
        </div>
      </div>

      {/* Super Admin Password Change Form Box */}
      {isPasswordChangeOpen && (
        <div className="p-5 bg-red-50/60 border border-red-200 rounded-3xl space-y-4 animate-in fade-in duration-200 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900">تغییر رمز عبور مدیر ارشد (Super Admin)</h3>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                <span className="font-bold">قانون امنیتی غیرقابل بازگشت:</span> رمز پیش‌فرض اولیه سیستم <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-red-200">123456</span> است. به محض ذخیره رمز جدید، رمز پیش‌فرض به صورت کامل و دائمی منقضی و مسدود خواهد شد و هیچ کاربری مجاز به استفاده از آن نخواهد بود.
              </p>
            </div>
          </div>

          {passwordChangeError && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-800 font-bold">
              {passwordChangeError}
            </div>
          )}

          <form onSubmit={handleSuperAdminPasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-neutral-700 font-bold mb-1">رمز عبور فعلی *:</label>
              <input
                type="password"
                value={currentPasswordInput}
                onChange={e => setCurrentPasswordInput(e.target.value)}
                placeholder="رمز فعلی (مثلاً 123456)"
                className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl font-mono text-left"
                required
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold mb-1">رمز عبور جدید *:</label>
              <input
                type="password"
                value={newPasswordInput}
                onChange={e => setNewPasswordInput(e.target.value)}
                placeholder="حداقل ۱۰ کاراکتر"
                className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl font-mono text-left"
                required
              />
            </div>
            <div>
              <label className="block text-neutral-700 font-bold mb-1">تکرار رمز جدید *:</label>
              <input
                type="password"
                value={confirmPasswordInput}
                onChange={e => setConfirmPasswordInput(e.target.value)}
                placeholder="تکرار رمز جدید"
                className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl font-mono text-left"
                required
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsPasswordChangeOpen(false)}
                className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-xl font-bold"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ثبت رمز جدید و ابطال همیشگی رمز 123456</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-right divide-y divide-neutral-200">
          <thead className="bg-neutral-50 font-bold text-neutral-700">
            <tr>
              <th className="p-3">مشخصات مدیر</th>
              <th className="p-3">نام کاربری</th>
              <th className="p-3">نقش سازمانی</th>
              <th className="p-3">مجوزهای فعال</th>
              <th className="p-3">اطلاعات تماس</th>
              <th className="p-3">وضعیت حساب</th>
              <th className="p-3 text-left">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {adminUsers.map(user => {
              const isSuper = user.role === 'super_admin';
              return (
                <tr key={user.id} className="hover:bg-neutral-50/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-neutral-200"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full border border-neutral-200 bg-neutral-100 text-neutral-600 grid place-items-center font-black text-xs"
                          aria-label={user.fullName}
                        >
                          {(user.fullName || user.username || '?').trim().slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-neutral-900">{user.fullName}</div>
                        <div className="text-[10px] text-neutral-400">ثبت: {user.createdAt}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 font-mono font-bold text-neutral-800">
                    {user.username}
                  </td>

                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'content_manager' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'order_manager' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.roleTitle}
                    </span>
                  </td>

                  <td className="p-3 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.canManageProducts && (
                        <span className="text-[9px] bg-neutral-100 text-neutral-700 px-1.5 py-0.2 rounded">محصولات</span>
                      )}
                      {user.permissions.canManageOrders && (
                        <span className="text-[9px] bg-neutral-100 text-neutral-700 px-1.5 py-0.2 rounded">سفارشات</span>
                      )}
                      {user.permissions.canManageArticles && (
                        <span className="text-[9px] bg-neutral-100 text-neutral-700 px-1.5 py-0.2 rounded">مقالات</span>
                      )}
                      {user.permissions.canManageSliders && (
                        <span className="text-[9px] bg-neutral-100 text-neutral-700 px-1.5 py-0.2 rounded">اسلایدرها</span>
                      )}
                      {user.permissions.canManageSettings && (
                        <span className="text-[9px] bg-neutral-100 text-neutral-700 px-1.5 py-0.2 rounded">تنظیمات</span>
                      )}
                      {user.permissions.canManageAdmins && (
                        <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">مدیران</span>
                      )}
                      {user.permissions.canManageVehicles && (
                        <span className="text-[9px] bg-neutral-100 text-neutral-700 px-1.5 py-0.2 rounded">خودروها</span>
                      )}
                    </div>
                  </td>

                  <td className="p-3 font-mono text-[11px] text-neutral-600">
                    <div>{user.phone || '—'}</div>
                    <div className="text-[10px] text-neutral-400">{user.email || '—'}</div>
                  </td>

                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {user.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>

                  <td className="p-3 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="ویرایش سطح دسترسی"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {!isSuper && (
                        <>
                          <button
                            onClick={() => toggleAdminStatus(user.id)}
                            className={`px-2 py-1 rounded text-[10px] font-bold ${
                              user.isActive ? 'bg-neutral-100 hover:bg-red-50 hover:text-red-600 text-neutral-600' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {user.isActive ? 'تعلیق' : 'فعال‌سازی'}
                          </button>

                          <button
                            onClick={() => deleteAdminUser(user.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف مدیر"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          MODAL: ADD / EDIT ADMIN USER
      ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-5 text-right shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-base text-neutral-900">
                {editingUser ? `ویرایش دسترسی‌های مدیر: ${editingUser.fullName}` : 'تعریف مدیر جدید در فروشگاه'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">نام و نام خانوادگی *:</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="مثال: علی احمدی"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">نام کاربری انگلیسی *:</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="inventory_tehran"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">
                    {editingUser ? 'رمز عبور جدید (در صورت نیاز به تغییر):' : 'رمز عبور اولیه *: (حداقل ۶ کاراکتر)'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={editingUser ? 'بدون تغییر' : '••••••••'}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">نقش سازمانی پیش‌فرض:</label>
                  <select
                    value={role}
                    onChange={e => handleRoleChange(e.target.value as AdminRole)}
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-bold"
                  >
                    <option value="super_admin">مدیر کل ارشد (دسترسی نامحدود)</option>
                    <option value="content_manager">مدیر محتوا و بلاگ</option>
                    <option value="order_manager">مدیر سفارشات و فاکتورها</option>
                    <option value="inventory_manager">مدیر کاتالوگ، انبار و قطعات</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">شماره تماس مستقیم:</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">ایمیل سازمانی:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@chinpart.ir"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl font-mono text-left"
                  />
                </div>
              </div>

              {/* Specific Custom Permissions Checkboxes */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <h4 className="font-black text-xs text-neutral-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-red-600" />
                  <span>تنظیم دقیق مجوزها و اختیارات این مدیر:</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageProducts}
                      onChange={e => setPermissions({ ...permissions, canManageProducts: e.target.checked })}
                      className="rounded text-red-600 w-4 h-4"
                    />
                    <span>مدیریت محصولات، قیمت‌ها و موجودی انبار</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageOrders}
                      onChange={e => setPermissions({ ...permissions, canManageOrders: e.target.checked })}
                      className="rounded text-red-600 w-4 h-4"
                    />
                    <span>مدیریت سفارش‌ها، صدور فاکتور و کد مرسوله</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageArticles}
                      onChange={e => setPermissions({ ...permissions, canManageArticles: e.target.checked })}
                      className="rounded text-red-600 w-4 h-4"
                    />
                    <span>انتشار و ویرایش مقالات وبلاگ و آموزش‌ها</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageSliders}
                      onChange={e => setPermissions({ ...permissions, canManageSliders: e.target.checked })}
                      className="rounded text-red-600 w-4 h-4"
                    />
                    <span>ساخت و ویرایش اسلایدرها و بنرهای تبلیغاتی</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageVehicles}
                      onChange={e => setPermissions({ ...permissions, canManageVehicles: e.target.checked })}
                      className="rounded text-red-600 w-4 h-4"
                    />
                    <span>مدیریت شرکت‌ها، خودروها و مدل‌ها</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canAccessSandbox}
                      onChange={e => setPermissions({ ...permissions, canAccessSandbox: e.target.checked })}
                      className="rounded text-red-600 w-4 h-4"
                    />
                    <span>دسترسی به درگاه تستی و شبیه‌ساز پرداخت</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-neutral-800 font-bold">
                    <input
                      type="checkbox"
                      checked={permissions.canManageSettings}
                      onChange={e => setPermissions({ ...permissions, canManageSettings: e.target.checked })}
                      className="rounded text-red-600 w-4 h-4"
                    />
                    <span>تنظیمات قالب، لوگو، فونت گوگل و درگاه‌ها</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-red-700 font-bold">
                    <input
                      type="checkbox"
                      checked={permissions.canManageAdmins}
                      onChange={e => setPermissions({ ...permissions, canManageAdmins: e.target.checked })}
                      className="rounded text-red-600 w-4 h-4"
                    />
                    <span>دسترسی به ساخت و حذف سایر مدیران</span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="rounded text-red-600 w-4 h-4"
                  />
                  <span>حساب این مدیر فعال و مجاز به ورود به پنل ادمین باشد</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700"
                >
                  ذخیره اطلاعات مدیر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
