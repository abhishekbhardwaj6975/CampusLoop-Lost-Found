const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { initDatabase, getDb } = require('./config/db');
const UserModel = require('./models/User');
const ItemModel = require('./models/Item');
const ClaimModel = require('./models/Claim');
const NotificationModel = require('./models/Notification');
const { uploadsDir } = require('./middleware/upload');
const { generateSampleImages } = require('./utils/generateSampleImages');

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

async function seedDatabase({ reset = false } = {}) {
  initDatabase();
  generateSampleImages(uploadsDir);

  const db = getDb();
  if (reset) {
    db.exec('DELETE FROM notifications;');
    db.exec('DELETE FROM claims;');
    db.exec('DELETE FROM items;');
    db.exec('DELETE FROM users;');
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','items','claims','notifications');");
  }

  const adminPass = await bcrypt.hash('admin123', 10);
  const studentPass = await bcrypt.hash('student123', 10);

  const admin = UserModel.create({
    name: 'Dr. Vikram Sharma',
    email: 'admin@campusloop.com',
    password: adminPass,
    role: 'admin',
    phone: '+91 98100 11001',
    department: 'Student Affairs & Administration',
  });

  const abhishek = UserModel.create({
    name: 'Abhishek Kumar',
    email: 'abhishek@campusloop.com',
    password: studentPass,
    role: 'student',
    phone: '+91 98765 43210',
    department: 'B.Tech CSE (3rd Year)',
  });

  const priya = UserModel.create({
    name: 'Priya Nair',
    email: 'priya@campusloop.com',
    password: studentPass,
    role: 'student',
    phone: '+91 98765 43211',
    department: 'B.Tech ECE (2nd Year)',
  });

  const rohan = UserModel.create({
    name: 'Rohan Verma',
    email: 'rohan@campusloop.com',
    password: studentPass,
    role: 'student',
    phone: '+91 98765 43212',
    department: 'B.Tech CSE (4th Year)',
  });

  const ananya = UserModel.create({
    name: 'Ananya Gupta',
    email: 'ananya@campusloop.com',
    password: studentPass,
    role: 'student',
    phone: '+91 98765 43213',
    department: 'B.Tech IT (2nd Year)',
  });

  const seededItems = [
    // Pair 1: AirPods Pro (Lost & Found - High Smart Match)
    ItemModel.create({
      title: 'Apple AirPods Pro (2nd Gen) in White Case',
      description:
        'Lost my white Apple AirPods Pro wireless earbuds in their charging case near the quiet reading tables on the 2nd floor of Central Library. The case has a small blue sticker on the back.',
      category: 'Electronics',
      type: 'lost',
      location: 'Central Library - 2nd Floor',
      date: daysAgo(1),
      images: ['/uploads/sample-airpods.svg'],
      status: 'open',
      reportedBy: abhishek.id,
    }),
    ItemModel.create({
      title: 'White Wireless Earbuds in Charging Case',
      description:
        'Found a pair of white wireless earbuds (looks like AirPods Pro) left on a study desk in Central Library 2nd Floor near the computer terminals. Has a tiny blue sticker on the back.',
      category: 'Electronics',
      type: 'found',
      location: 'Central Library - 2nd Floor',
      date: daysAgo(1),
      images: ['/uploads/sample-airpods.svg'],
      status: 'claimed',
      reportedBy: priya.id,
    }),

    // Pair 2: Brown Leather Wallet (Lost & Found - High Smart Match)
    ItemModel.create({
      title: 'Brown Bi-Fold Leather Wallet',
      description:
        'Misplaced my dark brown leather wallet during lunch hour at Main Cafeteria. Contains college mess card, metro card, and a few passport-size photos. No huge cash inside, mainly need my cards.',
      category: 'Wallet & Cash',
      type: 'lost',
      location: 'Main Cafeteria',
      date: daysAgo(2),
      images: ['/uploads/sample-wallet.svg'],
      status: 'open',
      reportedBy: rohan.id,
    }),
    ItemModel.create({
      title: 'Dark Brown Leather Wallet Found near Counter',
      description:
        'Picked up a brown bi-fold leather wallet from a table near the coffee counter in Main Cafeteria. Contains student mess card and metro pass. Deposited safely with me until verified.',
      category: 'Wallet & Cash',
      type: 'found',
      location: 'Main Cafeteria - Coffee Counter',
      date: daysAgo(2),
      images: ['/uploads/sample-wallet.svg'],
      status: 'open',
      reportedBy: ananya.id,
    }),

    // Pair 3: 65W USB-C Laptop Charger (Lost & Found)
    ItemModel.create({
      title: '65W USB-C Laptop Charger (White)',
      description:
        'Left my white 65W Type-C laptop power adapter plugged into row 3 during the Operating Systems lab session in CSE Block Lab 3. Has a grey velcro cable tie wrapped around the cord.',
      category: 'Electronics',
      type: 'lost',
      location: 'CSE Block - Lab 3',
      date: daysAgo(3),
      images: ['/uploads/sample-charger.svg'],
      status: 'open',
      reportedBy: abhishek.id,
    }),
    ItemModel.create({
      title: 'White Type-C Laptop Power Adapter',
      description:
        'Found a 65W USB-C laptop charger left behind at workstation 14 in CSE Block Lab 3 after the afternoon batch ended. Includes a grey velcro strap on the wire.',
      category: 'Electronics',
      type: 'found',
      location: 'CSE Block - Lab 3',
      date: daysAgo(3),
      images: ['/uploads/sample-charger.svg'],
      status: 'open',
      reportedBy: rohan.id,
    }),

    // Item 7: Campus ID Card (Found)
    ItemModel.create({
      title: 'B.Tech Student ID Card with Blue Lanyard',
      description:
        'Found a university student ID card attached to a royal blue lanyard on the grass walkway outside the Main Auditorium after the tech fest orientation.',
      category: 'ID & Cards',
      type: 'found',
      location: 'Main Auditorium Lawn',
      date: daysAgo(4),
      images: ['/uploads/sample-idcard.svg'],
      status: 'open',
      reportedBy: priya.id,
    }),

    // Item 8: Casio Scientific Calculator (Lost)
    ItemModel.create({
      title: 'Casio fx-991EX ClassWiz Scientific Calculator',
      description:
        'Forgot my black Casio fx-991EX scientific calculator inside Lecture Hall B-204 right after the Engineering Mathematics mid-sem quiz. My initials "A.G." are scratched inside the slide cover.',
      category: 'Electronics',
      type: 'lost',
      location: 'Lecture Hall B-204',
      date: daysAgo(2),
      images: ['/uploads/sample-calculator.svg'],
      status: 'open',
      reportedBy: ananya.id,
    }),

    // Item 9: DSA Textbook (Found - Returned via Approved Claim)
    ItemModel.create({
      title: 'Introduction to Algorithms (CLRS) Textbook',
      description:
        'Found a paperback copy of CLRS Algorithms textbook with yellow sticky notes and chapter 4 highlighted near the Seminar Hall entrance.',
      category: 'Books & Notes',
      type: 'found',
      location: 'Academic Block A - Seminar Hall',
      date: daysAgo(6),
      images: ['/uploads/sample-book.svg'],
      status: 'returned',
      reportedBy: rohan.id,
    }),

    // Item 10: Steel Water Bottle (Found)
    ItemModel.create({
      title: 'Matte Navy Insulated Steel Water Bottle (750ml)',
      description:
        'Someone left a navy blue Milton stainless steel insulated water bottle beside the basketball court bleachers after evening practice.',
      category: 'Water Bottles',
      type: 'found',
      location: 'Sports Complex - Basketball Court',
      date: daysAgo(5),
      images: ['/uploads/sample-bottle.svg'],
      status: 'open',
      reportedBy: abhishek.id,
    }),

    // Item 11: Eyeglasses (Lost)
    ItemModel.create({
      title: 'Black Rectangular Prescription Eyeglasses',
      description:
        'Lost my black matte rectangular prescription spectacles inside a dark grey hard case somewhere between the Mechanical Workshop and Hostel Gate 2.',
      category: 'Accessories',
      type: 'lost',
      location: 'Hostel Gate 2 Pathway',
      date: daysAgo(4),
      images: ['/uploads/sample-glasses.svg'],
      status: 'open',
      reportedBy: priya.id,
    }),

    // Item 12: Hostel Room Keys (Found)
    ItemModel.create({
      title: 'Bunch of 2 Brass Keys with Blue Keychain Tag',
      description:
        'Found a silver keyring holding two brass hostel/almirah keys with a rectangular blue plastic tag near the ATM kiosk outside Boys Hostel 3.',
      category: 'Keys',
      type: 'found',
      location: 'Hostel Block 3 - ATM Kiosk',
      date: daysAgo(1),
      images: ['/uploads/sample-keys.svg'],
      status: 'open',
      reportedBy: ananya.id,
    }),

    // Item 13: Power Bank (Lost)
    ItemModel.create({
      title: 'Mi 20000mAh Matte Black Power Bank',
      description:
        'Lost my black 20000mAh dual-USB power bank with a short braided USB-C cable attached, likely dropped near the campus bus stand.',
      category: 'Electronics',
      type: 'lost',
      location: 'Campus Main Gate - Bus Stand',
      date: daysAgo(7),
      images: ['/uploads/sample-powerbank.svg'],
      status: 'open',
      reportedBy: rohan.id,
    }),
  ];

  // Seed Claims for immediate Admin Claims Management testing
  // 1. Pending Claim: Abhishek claiming Priya's Found Earbuds, linked to Abhishek's Lost AirPods Pro
  ClaimModel.create({
    itemId: seededItems[1].id,
    lostItemId: seededItems[0].id,
    claimedBy: abhishek.id,
    proofText:
      'These are my AirPods Pro (2nd Gen). The back of the charging case has a small blue star sticker, and when paired with my iPhone the Bluetooth name shows "Abhishek AirPods Pro". I can show the Apple Find My serial number at the desk.',
    proofImage: '/uploads/sample-airpods.svg',
  });

  // 2. Approved Claim: Ananya claimed Rohan's Found CLRS Textbook
  const approvedClaim = ClaimModel.create({
    itemId: seededItems[8].id,
    lostItemId: null,
    claimedBy: ananya.id,
    proofText:
      'My name and roll number (22BIT048) are written in blue ink on the inside front cover, and page 82 has my handwritten Master Theorem notes.',
    proofImage: '',
  });
  ClaimModel.updateStatus(approvedClaim.id, {
    status: 'approved',
    adminNote: 'Verified roll number on front cover and college ID card. Handed over at desk.',
  });

  // 3. Rejected Claim: Rohan mistakenly claimed the Blue Lanyard ID Card
  const rejectedClaim = ClaimModel.create({
    itemId: seededItems[6].id,
    lostItemId: null,
    claimedBy: rohan.id,
    proofText: 'I think this might be my friend Siddharth’s ID card from 3rd year CSE.',
    proofImage: '',
  });
  ClaimModel.updateStatus(rejectedClaim.id, {
    status: 'rejected',
    adminNote: 'Card holder name does not match the description provided. Owner must claim directly.',
  });

  // Seed Notifications
  NotificationModel.create({
    userId: abhishek.id,
    message:
      'Smart Match (91%): "White Wireless Earbuds in Charging Case" found at Central Library matches your lost AirPods Pro!',
    link: `/items/${seededItems[1].id}`,
  });
  NotificationModel.create({
    userId: abhishek.id,
    message:
      'Smart Match (88%): "White Type-C Laptop Power Adapter" found at CSE Block - Lab 3 matches your lost 65W USB-C Charger.',
    link: `/items/${seededItems[5].id}`,
  });
  NotificationModel.create({
    userId: rohan.id,
    message:
      'Smart Match (89%): "Dark Brown Leather Wallet Found near Counter" matches your lost Brown Bi-Fold Leather Wallet.',
    link: `/items/${seededItems[3].id}`,
  });
  NotificationModel.create({
    userId: admin.id,
    message:
      'New claim submitted by Abhishek Kumar for "White Wireless Earbuds in Charging Case" requires verification.',
    link: '/admin/claims',
  });
  NotificationModel.create({
    userId: priya.id,
    message:
      'Abhishek Kumar submitted a claim for "White Wireless Earbuds in Charging Case". An admin will verify it shortly.',
    link: `/items/${seededItems[1].id}`,
  });

  console.log(
    `Seeded CampusLoop database successfully: 5 users (1 admin, 4 students), ${seededItems.length} items, 3 claims.`
  );
}

async function seedIfEmpty() {
  initDatabase();
  const totalUsers = UserModel.countAll();
  if (totalUsers === 0) {
    console.log('Empty database detected — seeding initial CampusLoop demo data...');
    await seedDatabase({ reset: false });
  }
}

if (require.main === module) {
  seedDatabase({ reset: true })
    .then(() => {
      console.log('Admin credentials: admin@campusloop.com / admin123');
      console.log('Student demo credentials: abhishek@campusloop.com / student123');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error seeding database:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase, seedIfEmpty };

