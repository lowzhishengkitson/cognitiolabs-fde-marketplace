export type Listing = {
  id: string; title: string; brand: string; model: string; price: number;
  cpu: string; gpu: string; ramGB: number; storageGB: number;
  screenSizeInches: number; weightKg: number;
  condition: "Like new" | "Good" | "Fair"; batteryHealth: number;
  description: string; sellerLocation: string;
};

// Illustrative second-hand listings; prices are in SGD.
export const listings: Listing[] = [
  { id: "thinkpad-t14", title: "ThinkPad T14 Gen 3 · workhorse", brand: "Lenovo", model: "ThinkPad T14 Gen 3", price: 890, cpu: "Intel Core i5-1245U", gpu: "Intel Iris Xe", ramGB: 16, storageGB: 512, screenSizeInches: 14, weightKg: 1.36, condition: "Good", batteryHealth: 86, description: "Reliable for coding and office work. Light wear on the lid; keyboard and ports work normally.", sellerLocation: "Tampines, Singapore" },
  { id: "macbook-air-m2", title: "MacBook Air M2 · travel light", brand: "Apple", model: "MacBook Air 13-inch M2", price: 1090, cpu: "Apple M2", gpu: "Apple M2 8-core GPU", ramGB: 8, storageGB: 256, screenSizeInches: 13.6, weightKg: 1.24, condition: "Like new", batteryHealth: 94, description: "Quiet and portable for study, writing and web development. Includes the original charger.", sellerLocation: "Queenstown, Singapore" },
  { id: "rog-g14", title: "ROG Zephyrus G14 · gaming and creation", brand: "ASUS", model: "ROG Zephyrus G14 2022", price: 1350, cpu: "AMD Ryzen 9 6900HS", gpu: "AMD Radeon RX 6700S", ramGB: 16, storageGB: 1000, screenSizeInches: 14, weightKg: 1.72, condition: "Good", batteryHealth: 81, description: "Compact performance laptop for gaming, editing and 3D projects. Small scuff near one corner.", sellerLocation: "Jurong East, Singapore" },
  { id: "latitude-5420", title: "Latitude 5420 · budget essentials", brand: "Dell", model: "Latitude 5420", price: 420, cpu: "Intel Core i5-1145G7", gpu: "Intel Iris Xe", ramGB: 8, storageGB: 256, screenSizeInches: 14, weightKg: 1.52, condition: "Fair", batteryHealth: 72, description: "Affordable for browsing, video calls and coursework. Visible scratches; battery replacement may help for long unplugged sessions.", sellerLocation: "Woodlands, Singapore" },
  { id: "envy-x360", title: "Envy x360 15 · touchscreen", brand: "HP", model: "Envy x360 15", price: 760, cpu: "AMD Ryzen 7 5825U", gpu: "AMD Radeon Graphics", ramGB: 16, storageGB: 512, screenSizeInches: 15.6, weightKg: 1.82, condition: "Good", batteryHealth: 84, description: "Convertible touchscreen for presentations, note-taking and multitasking. Touch input and hinge work normally.", sellerLocation: "Bishan, Singapore" },
  { id: "swift-3", title: "Swift 3 · lightweight student pick", brand: "Acer", model: "Swift 3 SF314", price: 570, cpu: "AMD Ryzen 5 5500U", gpu: "AMD Radeon Graphics", ramGB: 8, storageGB: 512, screenSizeInches: 14, weightKg: 1.19, condition: "Fair", batteryHealth: 78, description: "Easy to carry between classes; suitable for research, documents and light programming. Wear on underside.", sellerLocation: "Pasir Ris, Singapore" },
];

export const getListing = (id: string): Listing | undefined => listings.find((item) => item.id === id);
