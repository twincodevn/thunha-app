export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Chính sách bảo mật</h1>

                <div className="prose prose-gray">
                    <h2 className="text-xl font-semibold mt-6 mb-3">1. Thu thập thông tin</h2>
                    <p className="text-gray-600 mb-4">
                        Chúng tôi thu thập thông tin cần thiết để cung cấp dịch vụ quản lý nhà trọ,
                        bao gồm: tên, email, số điện thoại, và thông tin về bất động sản.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-3">2. Sử dụng thông tin</h2>
                    <p className="text-gray-600 mb-4">
                        Thông tin được sử dụng để: cung cấp dịch vụ, gửi thông báo hóa đơn,
                        hỗ trợ khách hàng và cải thiện trải nghiệm người dùng.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-3">3. Bảo vệ thông tin</h2>
                    <p className="text-gray-600 mb-4">
                        Dữ liệu được mã hóa và lưu trữ an toàn. Chúng tôi không bán hoặc
                        chia sẻ thông tin cá nhân với bên thứ ba mà không có sự đồng ý.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-3">4. Cookie</h2>
                    <p className="text-gray-600 mb-4">
                        Chúng tôi sử dụng cookie để duy trì phiên đăng nhập và cải thiện trải nghiệm.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-3">5. Quyền của bạn</h2>
                    <p className="text-gray-600 mb-4">
                        Bạn có quyền truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân của mình bất kỳ lúc nào.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-3">6. Liên hệ</h2>
                    <p className="text-gray-600 mb-4">
                        Về vấn đề bảo mật, vui lòng liên hệ: privacy@thunha.vn
                    </p>
                </div>

                <p className="text-sm text-gray-400 mt-8">Cập nhật lần cuối: 09/02/2026</p>
            </div>
        </div>
    );
}
