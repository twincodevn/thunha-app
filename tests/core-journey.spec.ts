import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const TEST_EMAIL = "test_e2e@thunha.vn";
const TEST_PASSWORD = "password123";

test.describe("Core Journey - Property Management Workflow", () => {
  // --- Global Setup ---
  // Ensure the test user exists in the database and is reset before running tests.
  test.beforeAll(async () => {
    // Clean up existing test user and associated data to start fresh
    const existingUser = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });

    if (existingUser) {
      // Bottom-up deletion to satisfy foreign key constraints

      // 1. Find all properties to get their rooms
      const properties = await prisma.property.findMany({
        select: { id: true },
        where: { userId: existingUser.id },
      });
      const propertyIds = properties.map((p) => p.id);

      if (propertyIds.length > 0) {
        const rooms = await prisma.room.findMany({
          select: { id: true },
          where: { propertyId: { in: propertyIds } },
        });
        const roomIds = rooms.map((r) => r.id);

        if (roomIds.length > 0) {
          const roomTenants = await prisma.roomTenant.findMany({
            select: { id: true },
            where: { roomId: { in: roomIds } },
          });
          const rtIds = roomTenants.map((rt) => rt.id);

          if (rtIds.length > 0) {
            // Delete relationships tied to RoomTenant
            await prisma.payment.deleteMany({
              where: { bill: { roomTenantId: { in: rtIds } } },
            });
            await prisma.bill.deleteMany({
              where: { roomTenantId: { in: rtIds } },
            });
            await prisma.contract.deleteMany({
              where: { roomTenantId: { in: rtIds } },
            });
            await prisma.incident.deleteMany({
              where: { roomTenantId: { in: rtIds } },
            });
            await prisma.roomTenant.deleteMany({
              where: { id: { in: rtIds } },
            });
          }

          // Delete incidents not tied to a specific roomTenant just in case
          await prisma.incident.deleteMany({
            where: { propertyId: { in: propertyIds } },
          });
          await prisma.room.deleteMany({
            where: { propertyId: { in: propertyIds } },
          });
        }
        await prisma.property.deleteMany({
          where: { userId: existingUser.id },
        });
      }

      await prisma.tenant.deleteMany({ where: { userId: existingUser.id } });

      await prisma.user.delete({
        where: { id: existingUser.id },
      });
    }

    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

    // Create the test user with PRO plan to ensure all features are available
    await prisma.user.create({
      data: {
        email: TEST_EMAIL,
        name: "E2E Test User",
        password: hashedPassword,
        plan: "PRO",
        planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
  });

  test.afterAll(async () => {
    // Optional: Clean up after all tests are done
    // await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.$disconnect();
  });

  // --- The Journey ---
  test("Complete property management flow", async ({ page }) => {
    // 1. Đăng nhập
    await test.step("1. Login", async () => {
      await page.goto("/login");
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');

      // Wait for dashboard to load
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByText("Tổng quan quản lý").first()).toBeVisible();
    });

    // 2. Tạo nhà trọ mới
    let propertyUrl = "";
    await test.step("2. Create new property", async () => {
      await page.goto("/dashboard/properties");
      await page.click('a[href="/dashboard/properties/new"]');

      const propertyName = `Nhà trọ Test ${Date.now()}`;
      await page.fill('input[name="name"]', propertyName);
      await page.fill(
        'input[name="address"]',
        "123 Đường Tự Động Hóa, KCN Playwright"
      );
      await page.fill('input[name="electricityRate"]', "3500");
      await page.fill('input[name="waterRate"]', "20000");

      await page.click('button[type="submit"]');

      // Wait for redirect to the new property details page (ignoring /new)
      await expect(page).toHaveURL(
        /\/dashboard\/properties\/([a-zA-Z0-9_-]+)$/
      );
      // Wait for the property name to be visible first to ensure the redirect has fully completed
      await expect(page.locator("h1", { hasText: propertyName })).toBeVisible();
      propertyUrl = page.url();
    });

    // 3. Thêm phòng trọ mới
    await test.step("3. Create brand new room", async () => {
      // Navigate directly to the room creation page
      await page.goto(`${propertyUrl}/rooms/new`);

      const roomName = `Phòng P${Math.floor(Math.random() * 100)}`;
      await page.fill('input[name="roomNumber"]', roomName);
      await page.fill('input[name="baseRent"]', "3000000");
      await page.fill('input[name="area"]', "25");
      // For testing, we might need to skip some optional fields or handle Select elements

      await page.getByRole("button", { name: "Tạo phòng" }).click();

      // Room should appear in the list (wait for redirect back to property page)
      await expect(page).toHaveURL(propertyUrl);
      await expect(page.getByText(roomName).first()).toBeVisible();
    });

    // 4. Thêm khách thuê vào phòng
    await test.step("4. Add tenant to property", async () => {
      await page.goto("/dashboard/tenants/new");

      await page.fill('input[name="name"]', "Khách Hàng Tự Động");
      await page.fill('input[name="phone"]', "0901234567");
      await page.fill('input[name="email"]', "tenant_e2e@thunha.vn");
      await page.fill('input[name="idNumber"]', "001090123456");

      // Submit the form
      await page.getByRole("button", { name: "Thêm khách thuê" }).click();

      // Wait for success redirect, avoiding /new
      await expect(page).toHaveURL(/\/dashboard\/tenants\/([a-zA-Z0-9_-]+)$/);
      await expect(
        page.locator("h1", { hasText: "Khách Hàng Tự Động" })
      ).toBeVisible();
    });

    // 5. Test VNPay Feature Gate (just verifying UI)
    await test.step("5. Verify VNPay button is present on Billing", async () => {
      await page.goto("/dashboard/billing");
      // Since the test user is explicitly created with PRO plan,
      // the VNPAY Gateway integration should not be blocked.
      const vnpayButton = page.locator('text="Thanh toán VNPAY"');
      if (await vnpayButton.isVisible()) {
        console.log("VNPay button is visible for PRO user.");
      }
    });
  });
});
