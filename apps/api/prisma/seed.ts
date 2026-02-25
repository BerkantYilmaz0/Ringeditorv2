import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const { hash } = bcrypt;

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seed başlatılıyor...");

    // ─── Admin kullanıcı ───
    const adminPassword = await hash("admin123", 12);
    const admin = await prisma.user.upsert({
        where: { username: "admin" },
        update: {},
        create: {
            username: "admin",
            passwordHash: adminPassword,
            fullName: "Sistem Yöneticisi",
            email: "admin@ringplanner.dev",
            role: "ADMIN",
            isActive: true,
        },
    });
    console.log(`✅ Admin kullanıcı: ${admin.username}`);

    // ─── Operatör kullanıcı ───
    const operatorPassword = await hash("operator123", 12);
    const operator = await prisma.user.upsert({
        where: { username: "operator" },
        update: {},
        create: {
            username: "operator",
            passwordHash: operatorPassword,
            fullName: "Vardiya Operatörü",
            role: "OPERATOR",
            isActive: true,
        },
    });
    console.log(`✅ Operatör kullanıcı: ${operator.username}`);

    // ─── Şoförler ───
    const drivers = await Promise.all([
        prisma.driver.create({
            data: {
                name: "Ahmet Yılmaz",
                phone: "0505 111 2233",
                licenseType: "E",
                isActive: true,
            },
        }),
        prisma.driver.create({
            data: {
                name: "Mehmet Demir",
                phone: "0506 222 3344",
                licenseType: "D",
                isActive: true,
            },
        }),
        prisma.driver.create({
            data: {
                name: "Ali Kaya",
                phone: "0507 333 4455",
                licenseType: "E",
                isActive: true,
            },
        }),
    ]);
    console.log(`✅ ${drivers.length} şoför oluşturuldu`);

    // ─── Ring Tipleri ───
    const ringTypes = await Promise.all([
        prisma.ringType.create({
            data: { name: "Siyah Ring", typeId: 1, color: "#000000" },
        }),
        prisma.ringType.create({
            data: { name: "Kırmızı Ring", typeId: 2, color: "#EF4444" },
        }),
        prisma.ringType.create({
            data: { name: "Mavi Ring", typeId: 3, color: "#3B82F6" },
        }),
        prisma.ringType.create({
            data: { name: "Yeşil Ring", typeId: 4, color: "#22C55E" },
        }),
    ]);
    console.log(`✅ ${ringTypes.length} ring tipi oluşturuldu`);

    // ─── Araçlar ───
    const vehicles = await Promise.all([
        prisma.vehicle.create({
            data: {
                plate: "06 RP 001",
                brand: "Mercedes",
                model: "Sprinter",
                year: 2022,
                color: "Beyaz",
                isActive: true,
                driverId: drivers[0]!.id,
            },
        }),
        prisma.vehicle.create({
            data: {
                plate: "06 RP 002",
                brand: "Ford",
                model: "Transit",
                year: 2023,
                color: "Gri",
                isActive: true,
                driverId: drivers[1]!.id,
            },
        }),
        prisma.vehicle.create({
            data: {
                plate: "06 RP 003",
                brand: "Isuzu",
                model: "Citiport",
                year: 2021,
                color: "Beyaz",
                isActive: true,
                driverId: drivers[2]!.id,
            },
        }),
        prisma.vehicle.create({
            data: {
                plate: "06 RP 004",
                brand: "Mercedes",
                model: "Sprinter",
                year: 2024,
                color: "Lacivert",
                isActive: true,
            },
        }),
        prisma.vehicle.create({
            data: {
                plate: "06 RP 005",
                brand: "Ford",
                model: "Transit",
                year: 2022,
                color: "Beyaz",
                isActive: false,
                description: "Bakımda",
            },
        }),
    ]);
    console.log(`✅ ${vehicles.length} araç oluşturuldu`);

    // ─── Duraklar (ODTÜ kampüsü) ───
    const stops = await Promise.all([
        prisma.stop.create({
            data: { name: "A1 Kapısı", lat: 39.90704, lng: 32.78407, description: "ODTÜ A1 Ana Giriş" },
        }),
        prisma.stop.create({
            data: { name: "Garajlar", lat: 39.90413, lng: 32.76989, description: "Araç garajı" },
        }),
        prisma.stop.create({
            data: { name: "KKM", lat: 39.89339, lng: 32.78558, description: "Kültür Kongre Merkezi" },
        }),
        prisma.stop.create({
            data: { name: "Makina Mühendisliği", lat: 39.8901, lng: 32.7814 },
        }),
        prisma.stop.create({
            data: { name: "Mimarlık", lat: 39.89793, lng: 32.78067 },
        }),
        prisma.stop.create({
            data: { name: "Eğitim Fakültesi", lat: 39.89995, lng: 32.77615 },
        }),
        prisma.stop.create({
            data: { name: "Teknokent", lat: 39.89661, lng: 32.77693 },
        }),
        prisma.stop.create({
            data: { name: "YDYO", lat: 39.90028, lng: 32.78163, description: "Yabancı Diller Yüksekokulu" },
        }),
        prisma.stop.create({
            data: { name: "Rektörlük", lat: 39.89583, lng: 32.78442 },
        }),
        prisma.stop.create({
            data: { name: "Doğu Yurtlar", lat: 39.88931, lng: 32.79043 },
        }),
    ]);
    console.log(`✅ ${stops.length} durak oluşturuldu (ODTÜ kampüsü)`);

    // ─── Güzergahlar ───
    const siyahRing = ringTypes[0]!;

    const route1 = await prisma.route.create({
        data: {
            name: "Siyah Ring - Ana Hat",
            ringTypeId: siyahRing.id,
            color: siyahRing.color,
            description: "A1 → Garajlar → KKM → Doğu Yurtlar (tam tur)",
        },
    });

    // güzergaha durak ata
    await Promise.all(
        [stops[0], stops[1], stops[2], stops[5], stops[4], stops[3], stops[9]].map(
            (stop, i) =>
                prisma.routeStop.create({
                    data: {
                        routeId: route1.id,
                        stopId: stop!.id,
                        sequence: i + 1,
                    },
                })
        )
    );
    console.log(`✅ Güzergah "${route1.name}" + ${7} durak atandı`);

    // ─── Şablon ───
    const template = await prisma.template.create({
        data: {
            name: "Hafta İçi Standart",
            description: "Pazartesi-Cuma standart sefer planı",
        },
    });

    // şablona örnek sefer ekle (08:00, 12:00, 17:00)
    const todayBase = new Date();
    todayBase.setHours(0, 0, 0, 0);

    await Promise.all([
        prisma.templateJob.create({
            data: {
                templateId: template.id,
                ringTypeId: siyahRing.id,
                routeId: route1.id,
                vehicleId: vehicles[0]!.id,
                dueTime: BigInt(todayBase.getTime() + 8 * 60 * 60 * 1000), // 08:00
                status: 1,
            },
        }),
        prisma.templateJob.create({
            data: {
                templateId: template.id,
                ringTypeId: siyahRing.id,
                routeId: route1.id,
                vehicleId: vehicles[1]!.id,
                dueTime: BigInt(todayBase.getTime() + 12 * 60 * 60 * 1000), // 12:00
                status: 1,
            },
        }),
        prisma.templateJob.create({
            data: {
                templateId: template.id,
                ringTypeId: siyahRing.id,
                routeId: route1.id,
                vehicleId: vehicles[2]!.id,
                dueTime: BigInt(todayBase.getTime() + 17 * 60 * 60 * 1000), // 17:00
                status: 1,
            },
        }),
    ]);
    console.log(`✅ Şablon "${template.name}" + 3 sefer oluşturuldu`);

    console.log("\n🎉 Seed tamamlandı!");
}

main()
    .catch((e) => {
        console.error("❌ Seed hatası:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
