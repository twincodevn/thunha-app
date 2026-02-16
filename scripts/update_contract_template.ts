
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const REAL_CONTRACT_CONTENT = `
<div style="font-family: 'Times New Roman', Times, serif; color: #000;">
    <div style="text-align: center; font-weight: bold; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 14pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p style="margin: 0; font-size: 13pt; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</p>
    </div>

    <div style="text-align: center; font-weight: bold; margin-bottom: 30px;">
        <h1 style="font-size: 16pt; margin: 0;">HỢP ĐỒNG THUÊ NHÀ TRỌ</h1>
    </div>

    <p>Hôm nay, ngày {{START_DATE}}.</p>
    <p>Tại địa chỉ: {{PROPERTY_ADDRESS}}</p>

    <p><strong>Chúng tôi gồm có:</strong></p>

    <div style="margin-left: 20px;">
        <p><strong>BÊN A (BÊN CHO THUÊ):</strong></p>
        <p>Ông/Bà: <strong>{{LANDLORD_NAME}}</strong></p>
        <p>Điện thoại: {{LANDLORD_PHONE}}</p>
    </div>

    <div style="margin-left: 20px; margin-top: 15px;">
        <p><strong>BÊN B (BÊN THUÊ):</strong></p>
        <p>Ông/Bà: <strong>{{TENANT_NAME}}</strong></p>
        <p>Số CCCD/CMND: {{TENANT_ID}}</p>
        <p>Hộ khẩu thường trú: {{TENANT_ADDRESS}}</p>
    </div>

    <p>Sau khi thỏa thuận, hai bên thống nhất ký kết hợp đồng thuê nhà trọ với các điều khoản sau:</p>

    <p><strong>Điều 1: Đối tượng hợp đồng</strong></p>
    <p>Bên A đồng ý cho Bên B thuê phòng trọ số <strong>{{ROOM_NUMBER}}</strong> tại địa chỉ {{PROPERTY_ADDRESS}} để ở.</p>

    <p><strong>Điều 2: Thời hạn và giá thuê</strong></p>
    <ul style="list-style-type: disc; margin-left: 20px;">
        <li>Thời hạn thuê: Từ ngày {{START_DATE}} đến ngày {{END_DATE}}.</li>
        <li>Giá thuê phòng: <strong>{{RENT_PRICE}}</strong>/tháng.</li>
        <li>Tiền cọc đảm bảo: <strong>{{DEPOSIT}}</strong> (Hoàn trả khi hết hợp đồng và không vi phạm).</li>
        <li>Giá điện: {{ELEC_PRICE}}/kWh (theo chỉ số công tơ riêng).</li>
        <li>Giá nước: {{WATER_PRICE}} (theo khối hoặc người).</li>
    </ul>

    <p><strong>Điều 3: Trách nhiệm của Bên B</strong></p>
    <ul style="list-style-type: disc; margin-left: 20px;">
        <li>Thanh toán tiền thuê và dịch vụ đúng hạn (từ ngày 01 đến ngày 05 hàng tháng).</li>
        <li>Giữ gìn vệ sinh chung, trật tự an ninh, không gây ồn ào ảnh hưởng người xung quanh.</li>
        <li>Không tàng trữ chất cấm, vũ khí, vật liệu nổ.</li>
        <li>Bảo quản tài sản trong phòng, hỏng hóc do lỗi Bên B phải đền bù.</li>
    </ul>

    <p><strong>Điều 4: Trách nhiệm của Bên A</strong></p>
    <ul style="list-style-type: disc; margin-left: 20px;">
        <li>Bàn giao phòng và trang thiết bị (nếu có) đúng hiện trạng.</li>
        <li>Đảm bảo hệ thống điện nước hoạt động bình thường.</li>
    </ul>

    <p><strong>Điều 5: Cam kết chung</strong></p>
    <p>Hai bên cam kết thực hiện đúng các điều khoản trên. Nếu có tranh chấp sẽ thương lượng giải quyết. Hợp đồng được lập thành 02 bản có giá trị như nhau, mỗi bên giữ 01 bản.</p>

    <div style="display: flex; justify-content: space-between; margin-top: 40px; text-align: center;">
        <div style="width: 45%;">
            <p><strong>BÊN A</strong></p>
            <p style="font-style: italic;">(Ký, ghi rõ họ tên)</p>
            <br/><br/><br/>
            <p><strong>{{LANDLORD_NAME}}</strong></p>
        </div>
        <div style="width: 45%;">
            <p><strong>BÊN B</strong></p>
            <p style="font-style: italic;">(Ký, ghi rõ họ tên)</p>
        </div>
    </div>
</div>
`;

async function main() {
    console.log("Updating Contract Templates...");

    // 1. Update all templates
    const templates = await prisma.contractTemplate.findMany();
    if (templates.length === 0) {
        console.log("No templates found. Creating default...");
        await prisma.contractTemplate.create({
            data: {
                name: "Hợp đồng thuê trọ chuẩn",
                content: REAL_CONTRACT_CONTENT,
                userId: "placeholder", // This assumption might be wrong, need to check schema. 
                // Wait, Template usually belongs to a user or is global.
                // Let's check schema for ContractTemplate first? 
                // Assuming it has name and content.
            }
        });
    } else {
        await prisma.contractTemplate.updateMany({
            data: {
                content: REAL_CONTRACT_CONTENT
            }
        });
        console.log(`Updated ${templates.length} templates.`);
    }

    // 2. Update specific contract if exists
    const contractId = "cmlorncma00010mubhunxig3e"; // From User Request
    const specificContract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: { roomTenant: { include: { room: { include: { property: { include: { user: true } } } }, tenant: true } } }
    });

    if (specificContract) {
        console.log("Found specific contract, updating content with replacements...");

        let content = REAL_CONTRACT_CONTENT;
        const roomTenant = specificContract.roomTenant;
        const startDate = specificContract.startDate;
        const endDate = specificContract.endDate;

        // Same replacement logic as generate-action.ts
        const replacements: Record<string, string> = {
            "{{TENANT_NAME}}": roomTenant.tenant.name,
            "{{TENANT_ID}}": roomTenant.tenant.idNumber || "....................",
            "{{TENANT_ADDRESS}}": roomTenant.tenant.address || "....................",
            "{{ROOM_NUMBER}}": roomTenant.room.roomNumber,
            "{{RENT_PRICE}}": roomTenant.room.baseRent.toLocaleString('vi-VN') + " đ",
            "{{DEPOSIT}}": (roomTenant.room.deposit || 0).toLocaleString('vi-VN') + " đ",
            "{{ELEC_PRICE}}": roomTenant.room.property.electricityRate.toLocaleString('vi-VN') + " đ",
            "{{WATER_PRICE}}": roomTenant.room.property.waterRate.toLocaleString('vi-VN') + " đ",
            "{{START_DATE}}": startDate.toLocaleDateString('vi-VN'),
            "{{END_DATE}}": endDate ? endDate.toLocaleDateString('vi-VN') : "Không thời hạn",
            "{{PROPERTY_ADDRESS}}": roomTenant.room.property.address,
            "{{LANDLORD_NAME}}": roomTenant.room.property.user.name,
            "{{LANDLORD_PHONE}}": roomTenant.room.property.user.phone || "",
        };

        for (const [key, value] of Object.entries(replacements)) {
            content = content.replace(new RegExp(key, "g"), value);
        }

        await prisma.contract.update({
            where: { id: contractId },
            data: { content: content }
        });
        console.log("Updated specific contract content.");
    } else {
        console.log("Specific contract not found.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
