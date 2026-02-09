export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Điều khoản sử dụng</h1>

                <div className="prose prose-gray">
                    <h2 className="text-xl font-semibold mt-6 mb-3">1. Giới thiệu</h2>
                    <p className="text-gray-600 mb-4">
                        Chào mừng bạn đến với ThuNhà - Hệ thống quản lý nhà trọ thông minh.
                        Bằng việc sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản sau.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-3">2. Quyền sử dụng</h2>
                    <p className="text-gray-600 mb-4">
                        Bạn được cấp quyền sử dụng dịch vụ cho mục đích quản lý nhà trọ cá nhân hoặc doanh nghiệp.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-3">3. Trách nhiệm người dùng</h2>
                    <p className="text-gray-600 mb-4">
                        Người dùng chịu trách nhiệm về độ chính xác của dữ liệu nhập vào hệ thống
                        và bảo mật thông tin tài khoản.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-3">4. Bảo mật dữ liệu</h2>
                    <p className="text-gray-600 mb-4">
                        Chúng tôi cam kết bảo vệ dữ liệu của bạn theo quy định pháp luật Việt Nam.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-3">5. Liên hệ</h2>
                    <p className="text-gray-600 mb-4">
                        Mọi thắc mắc xin liên hệ: support@thunha.vn
                    </p>
                </div>

                <p className="text-sm text-gray-400 mt-8">Cập nhật lần cuối: 09/02/2026</p>
            </div>
        </div>
    );
}
