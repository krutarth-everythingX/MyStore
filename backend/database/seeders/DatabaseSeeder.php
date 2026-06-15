<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Warehouse;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Clear existing records to ensure a clean seed
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        Product::truncate();
        Category::truncate();
        Brand::truncate();
        Warehouse::truncate();
        User::truncate();
        \App\Models\Coupon::truncate();
        \Illuminate\Support\Facades\DB::table('category_product')->truncate();
        \Illuminate\Support\Facades\DB::table('warehouse_product')->truncate();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        // 1. Create Base Buyer Account (verified)
        $buyer = User::create([
            'name' => 'John Buyer',
            'email' => 'buyer@example.com',
            'email_verified_at' => now(),
            'phone' => '+15550100100',
            'password' => Hash::make('password'),
            'role' => 'buyer',
            'address' => '100 Main St, New York, NY',
            'card_number' => '1111-2222-3333-4444',
            'card_expiry' => '12/28',
            'card_cvv' => '123'
        ]);

        // 2. Comprehensive A-Z Category and Product Structured Seed Data
        $categoryData = [
            'Automotive' => [
                'seller' => ['name' => 'Al\'s Auto Parts', 'email' => 'automotive-seller@example.com', 'brand' => 'DriveSync', 'city' => 'Detroit', 'state' => 'MI', 'zip' => '48201'],
                'subs' => [
                    'Car Parts' => [
                        [
                            'name' => 'Performance Ceramic Brake Pads',
                            'desc' => 'Premium ceramic brake pads for front wheels. Noise-free, low dust, and enhanced stopping power.',
                            'short' => 'Front ceramic brake pads.',
                            'price' => 59.99,
                            'sale' => 49.99,
                            'sku' => 'AUTO-BRK-101',
                            'tags' => ['brakes', 'ceramic', 'pads']
                        ],
                        [
                            'name' => 'High-Flow Engine Air Filter',
                            'desc' => 'High performance replacement engine air filter. Improves acceleration and engine efficiency.',
                            'short' => 'Engine air filter.',
                            'price' => 24.99,
                            'sale' => null,
                            'sku' => 'AUTO-FLT-202',
                            'tags' => ['filter', 'engine', 'air']
                        ]
                    ],
                    'Car Accessories' => [
                        [
                            'name' => 'All-Weather Rubber Floor Mats',
                            'desc' => 'Heavy-duty 4-piece rubber floor mats. Waterproof, dirt-proof, custom trim fit for cars, SUVs, and trucks.',
                            'short' => 'Heavy-duty floor mats.',
                            'price' => 39.99,
                            'sale' => 34.99,
                            'sku' => 'AUTO-MAT-303',
                            'tags' => ['floor mats', 'rubber', 'all-weather']
                        ],
                        [
                            'name' => 'Dual-Lens 1080p Dash Camera',
                            'desc' => 'Front and rear dual-lens dashcam with night vision, loop recording, G-sensor, and 170-degree wide angle view.',
                            'short' => 'Dual 1080p dashcam.',
                            'price' => 89.99,
                            'sale' => null,
                            'sku' => 'AUTO-CAM-404',
                            'tags' => ['dashcam', 'camera', 'security']
                        ]
                    ]
                ]
            ],
            'Baby Products' => [
                'seller' => ['name' => 'Babyland Boutique', 'email' => 'baby-seller@example.com', 'brand' => 'LittleSteps', 'city' => 'Orlando', 'state' => 'FL', 'zip' => '32801'],
                'subs' => [
                    'Baby Clothing' => [
                        [
                            'name' => 'Organic Cotton Onesies (5-Pack)',
                            'desc' => 'Super soft 100% organic cotton baby body suits with easy snap closures.',
                            'short' => 'Organic onesies pack.',
                            'price' => 29.99,
                            'sale' => 24.99,
                            'sku' => 'BABY-ONS-101',
                            'tags' => ['clothing', 'cotton', 'onesie']
                        ]
                    ],
                    'Strollers' => [
                        [
                            'name' => 'All-Terrain Jogger Stroller',
                            'desc' => 'Three-wheel premium jogging stroller with rubber air tires, suspension, and multi-position reclining seat.',
                            'short' => 'All-terrain jogger stroller.',
                            'price' => 249.99,
                            'sale' => null,
                            'sku' => 'BABY-JOG-202',
                            'tags' => ['stroller', 'jogging', 'outdoor']
                        ]
                    ]
                ]
            ],
            'Computers & Electronics' => [
                'seller' => ['name' => 'Silicon Valley Tech', 'email' => 'tech-seller@example.com', 'brand' => 'ApexGizmos', 'city' => 'San Jose', 'state' => 'CA', 'zip' => '95101'],
                'subs' => [
                    'Laptops' => [
                        // We will map sub-subcategories inside category generation logic
                    ],
                    'Mobile Phones' => [
                        [
                            'name' => 'Quantum Phone 12',
                            'desc' => 'Next generation smartphone featuring 5G capability, OLED edge-to-edge screen, and triple lens 48MP camera.',
                            'short' => '5G flagship smartphone.',
                            'price' => 799.99,
                            'sale' => 699.99,
                            'sku' => 'QN-PHN-12',
                            'tags' => ['phone', 'mobile', '5g']
                        ]
                    ],
                    'Headphones' => [
                        [
                            'name' => 'Apex ANC Headphones',
                            'desc' => 'Immersive active noise-cancelling wireless headphones with 40-hour battery life and quick charge support.',
                            'short' => 'ANC wireless headphones.',
                            'price' => 299.99,
                            'sale' => null,
                            'sku' => 'AP-ANC-HD',
                            'tags' => ['headphones', 'audio', 'wireless']
                        ]
                    ]
                ]
            ],
            'Digital Media & Books' => [
                'seller' => ['name' => 'ByteSized Books', 'email' => 'media-seller@example.com', 'brand' => 'ReadAloud', 'city' => 'Seattle', 'state' => 'WA', 'zip' => '98101'],
                'subs' => [
                    'E-books' => [
                        [
                            'name' => 'Learn Laravel in 30 Days',
                            'desc' => 'The ultimate practical guide to learning Laravel. Build modern, robust web applications from scratch.',
                            'short' => 'Laravel developer e-book.',
                            'price' => 14.99,
                            'sale' => 9.99,
                            'sku' => 'BK-LAR-30D',
                            'tags' => ['laravel', 'book', 'coding']
                        ]
                    ],
                    'Audiobooks' => [
                        [
                            'name' => 'The Art of Clean Code Audiobook',
                            'desc' => 'Learn how to write readable, reusable, and maintainable software architecture. Read by the author.',
                            'short' => 'Clean code audiobook.',
                            'price' => 29.99,
                            'sale' => 19.99,
                            'sku' => 'AB-CLN-COD',
                            'tags' => ['clean code', 'audiobook', 'software']
                        ]
                    ]
                ]
            ],
            'Entertainment & Toys' => [
                'seller' => ['name' => 'Toy Chest Co.', 'email' => 'fun-seller@example.com', 'brand' => 'ToyBox', 'city' => 'Dallas', 'state' => 'TX', 'zip' => '75201'],
                'subs' => [
                    'Board Games' => [
                        [
                            'name' => 'MageQuest Strategy Board Game',
                            'desc' => 'Immersive fantasy roleplaying board game. Cooperative play for 2-4 players with detailed miniatures.',
                            'short' => 'Cooperative board game.',
                            'price' => 45.00,
                            'sale' => 39.99,
                            'sku' => 'TOY-GM-MQ',
                            'tags' => ['board game', 'fantasy', 'minis']
                        ]
                    ],
                    'Action Figures' => [
                        [
                            'name' => 'Robot Sentinel Action Figure',
                            'desc' => '12-inch fully posable robot sentinel with LED light-up features and articulation gear.',
                            'short' => 'Light-up action figure.',
                            'price' => 29.99,
                            'sale' => 24.99,
                            'sku' => 'TOY-AF-ROB',
                            'tags' => ['figure', 'robot', 'toy']
                        ]
                    ]
                ]
            ],
            'Fashion & Apparel' => [
                'seller' => ['name' => 'Urban Apparel Outlet', 'email' => 'style-seller@example.com', 'brand' => 'UrbanThreads', 'city' => 'Los Angeles', 'state' => 'CA', 'zip' => '90001'],
                'subs' => [
                    'Jackets' => [
                        // Sub-subcategories will be created
                    ],
                    'Shoes' => [
                        [
                            'name' => 'Minimalist Leather Sneakers',
                            'desc' => 'Sleek white sneakers handcrafted with full-grain calfskin leather and durable rubber soles.',
                            'short' => 'White leather sneakers.',
                            'price' => 120.00,
                            'sale' => null,
                            'sku' => 'UT-LTH-SN',
                            'tags' => ['shoes', 'sneakers', 'leather']
                        ]
                    ],
                    'Shirts' => [
                        [
                            'name' => 'Oxford Button-Down Shirt',
                            'desc' => 'Classic tailored fit Oxford button-down shirt. Breathable cotton blend fabric for casual or smart look.',
                            'short' => 'Oxford button-down shirt.',
                            'price' => 45.00,
                            'sale' => 39.99,
                            'sku' => 'UT-OXF-SH',
                            'tags' => ['shirt', 'cotton', 'apparel']
                        ]
                    ]
                ]
            ],
            'Grocery & Food' => [
                'seller' => ['name' => 'Harvest Market', 'email' => 'food-seller@example.com', 'brand' => 'GreenGrocer', 'city' => 'Austin', 'state' => 'TX', 'zip' => '78701'],
                'subs' => [
                    'Snacks' => [
                        [
                            'name' => 'Organic Roasted Salted Almonds',
                            'desc' => 'Healthy snack choice. Non-GMO, USDA organic almonds dry-roasted with sea salt.',
                            'short' => 'Organic roasted almonds.',
                            'price' => 12.99,
                            'sale' => 10.99,
                            'sku' => 'GR-ALM-101',
                            'tags' => ['snacks', 'nuts', 'organic']
                        ]
                    ],
                    'Beverages' => [
                        [
                            'name' => 'Premium Cold Brew Coffee (4-Pack)',
                            'desc' => 'Rich and smooth cold brew coffee. Low acidity, high caffeine. Brewed with organic Arabica beans.',
                            'short' => 'Organic cold brew pack.',
                            'price' => 18.00,
                            'sale' => 14.99,
                            'sku' => 'GR-COF-303',
                            'tags' => ['coffee', 'beverage', 'organic']
                        ]
                    ]
                ]
            ],
            'Home & Kitchen' => [
                'seller' => ['name' => 'Cozy Nest Furnishings', 'email' => 'home-seller@example.com', 'brand' => 'EcoLiving', 'city' => 'Chicago', 'state' => 'IL', 'zip' => '60601'],
                'subs' => [
                    'Furniture' => [
                        [
                            'name' => 'Bamboo Dining Table',
                            'desc' => 'Eco-friendly dining table made of sustainably harvested bamboo, seating up to 6 people comfortably.',
                            'short' => 'Bamboo dining table.',
                            'price' => 450.00,
                            'sale' => 399.00,
                            'sku' => 'EL-BAM-DT',
                            'tags' => ['table', 'furniture', 'bamboo']
                        ]
                    ],
                    'Cookware' => [
                        [
                            'name' => 'Non-Stick Ceramic Frying Pan',
                            'desc' => 'Toxin-free non-stick ceramic frying pan. 10-inch scratch-resistant surface with heat-resistant handle.',
                            'short' => '10-inch ceramic frying pan.',
                            'price' => 49.99,
                            'sale' => 39.99,
                            'sku' => 'HM-CKW-PAN',
                            'tags' => ['cookware', 'pan', 'kitchen']
                        ]
                    ],
                    'Lighting' => [
                        [
                            'name' => 'Modern Brass Pendant Light',
                            'desc' => 'Elegant brushed brass hanging lamp with a minimalist dome shade, perfect for dining rooms or kitchens.',
                            'short' => 'Brass hanging lamp.',
                            'price' => 150.00,
                            'sale' => null,
                            'sku' => 'EL-BRS-PL',
                            'tags' => ['lighting', 'lamp', 'brass']
                        ]
                    ]
                ]
            ],
            'Industrial & Tools' => [
                'seller' => ['name' => 'Precision Tools Depot', 'email' => 'tools-seller@example.com', 'brand' => 'ProEquip', 'city' => 'Cleveland', 'state' => 'OH', 'zip' => '44101'],
                'subs' => [
                    'Power Tools' => [
                        [
                            'name' => '20V Max Cordless Drill Kit',
                            'desc' => 'Compact cordless drill driver with 20V battery, quick charger, and 30-piece drill and screwdriver bits.',
                            'short' => '20V cordless drill kit.',
                            'price' => 99.99,
                            'sale' => 89.99,
                            'sku' => 'IND-DRL-20V',
                            'tags' => ['drill', 'powertools', 'cordless']
                        ]
                    ],
                    'Lab Equipment' => [
                        [
                            'name' => 'High Precision Digital Scale',
                            'desc' => 'Lab-grade analytical balance scale with 0.01g accuracy and clear LCD backlit display.',
                            'short' => '0.01g analytical digital scale.',
                            'price' => 45.00,
                            'sale' => 38.50,
                            'sku' => 'IND-SCL-HP',
                            'tags' => ['scale', 'lab', 'measuring']
                        ]
                    ]
                ]
            ],
            'Jewelry & Accessories' => [
                'seller' => ['name' => 'Glimmer Gold Jewelry', 'email' => 'jewelry-seller@example.com', 'brand' => 'ShimmerCo', 'city' => 'New York', 'state' => 'NY', 'zip' => '10001'],
                'subs' => [
                    'Watches' => [
                        [
                            'name' => 'Chrono Titanium Watch',
                            'desc' => 'Elegant chronograph watch built with premium lightweight titanium casing and scratch-resistant sapphire crystal.',
                            'short' => 'Titanium chronograph watch.',
                            'price' => 250.00,
                            'sale' => 199.99,
                            'sku' => 'JW-WTC-TI',
                            'tags' => ['watch', 'chrono', 'titanium']
                        ]
                    ],
                    'Necklaces' => [
                        [
                            'name' => 'Sterling Silver Compass Pendant',
                            'desc' => 'Sterling silver compass pendant necklace. Adjustable chain, perfect travel adventure keepsake gift.',
                            'short' => 'Silver compass necklace.',
                            'price' => 49.99,
                            'sale' => 39.99,
                            'sku' => 'JW-NCK-SLV',
                            'tags' => ['necklace', 'silver', 'jewelry']
                        ]
                    ]
                ]
            ],
            'Kid\'s Items' => [
                'seller' => ['name' => 'Kid Wonder Toy Maker', 'email' => 'kids-seller@example.com', 'brand' => 'KidWonder', 'city' => 'Boston', 'state' => 'MA', 'zip' => '02101'],
                'subs' => [
                    'Educational Toys' => [
                        [
                            'name' => 'Solar System Orbit Building Kit',
                            'desc' => 'DIY rotating solar system model kit for children. Learn planetary physics through play.',
                            'short' => 'Solar system model kit.',
                            'price' => 39.99,
                            'sale' => 34.99,
                            'sku' => 'KD-ED-SOL',
                            'tags' => ['educational', 'science', 'toys']
                        ]
                    ],
                    'Puzzles' => [
                        [
                            'name' => '1000-Piece Landscape Wooden Puzzle',
                            'desc' => 'Challenging high-definition wooden landscape jigsaw puzzle. Anti-glare coating and perfect-fit tech.',
                            'short' => '1000-piece wooden puzzle.',
                            'price' => 24.99,
                            'sale' => 19.99,
                            'sku' => 'KD-PZ-LND',
                            'tags' => ['puzzle', 'wood', 'jigsaw']
                        ]
                    ]
                ]
            ],
            'Luggage & Bags' => [
                'seller' => ['name' => 'Nomad Pack Supply', 'email' => 'bags-seller@example.com', 'brand' => 'PackLight', 'city' => 'Denver', 'state' => 'CO', 'zip' => '80201'],
                'subs' => [
                    'Suitcases' => [
                        [
                            'name' => 'Hardshell Expandable Carry-On',
                            'desc' => 'Sleek scratch-resistant polycarbonate carry-on luggage. Spinner wheels and TSA-approved locks.',
                            'short' => 'TSA spinner suitcase.',
                            'price' => 135.00,
                            'sale' => 115.00,
                            'sku' => 'BG-SUT-HC',
                            'tags' => ['suitcase', 'luggage', 'travel']
                        ]
                    ],
                    'Backpacks' => [
                        [
                            'name' => 'Water-Resistant Commuter Backpack',
                            'desc' => 'Modern professional commuter bag with padded 15.6-inch laptop compartment and integrated USB charge port.',
                            'short' => 'USB laptop backpack.',
                            'price' => 65.00,
                            'sale' => 55.00,
                            'sku' => 'BG-BP-COM',
                            'tags' => ['backpack', 'commuter', 'laptop']
                        ]
                    ]
                ]
            ],
            'Musical Instruments' => [
                'seller' => ['name' => 'Rhythm & Blue Music', 'email' => 'music-seller@example.com', 'brand' => 'SoundWave', 'city' => 'Nashville', 'state' => 'TN', 'zip' => '37201'],
                'subs' => [
                    'Guitars' => [
                        [
                            'name' => 'Acoustic Spruce Guitar Kit',
                            'desc' => 'Full size 41-inch acoustic guitar crafted with spruce top. Includes tuner, picks, straps, and gig bag.',
                            'short' => 'Spruce acoustic guitar kit.',
                            'price' => 150.00,
                            'sale' => 129.99,
                            'sku' => 'MU-GTR-AC',
                            'tags' => ['guitar', 'acoustic', 'instrument']
                        ]
                    ],
                    'Keyboards' => [
                        [
                            'name' => '61-Key Portable Electronic Keyboard',
                            'desc' => 'LCD display electronic keyboard. Built-in recording, metronome, speaker outputs, and training settings.',
                            'short' => '61-key electronic keyboard.',
                            'price' => 120.00,
                            'sale' => 99.99,
                            'sku' => 'MU-KYB-61',
                            'tags' => ['keyboard', 'piano', 'digital']
                        ]
                    ]
                ]
            ],
            'Novelties & Gifts' => [
                'seller' => ['name' => 'Gifted Hands Studio', 'email' => 'gifts-seller@example.com', 'brand' => 'PresentTense', 'city' => 'Miami', 'state' => 'FL', 'zip' => '33101'],
                'subs' => [
                    'Cards' => [
                        [
                            'name' => 'Assorted Greeting Cards Set (20-Pack)',
                            'desc' => 'Box of 20 unique handwritten design greeting cards for birthdays, anniversaries, and holidays.',
                            'short' => '20-pack greeting cards.',
                            'price' => 19.99,
                            'sale' => 14.99,
                            'sku' => 'NV-CRD-AST',
                            'tags' => ['cards', 'gift', 'stationery']
                        ]
                    ],
                    'Keepsakes' => [
                        [
                            'name' => 'Engraved Vintage Wooden Keepsake Box',
                            'desc' => 'Solid cherry wood memory box with intricate key-locked latch and vintage custom engraving options.',
                            'short' => 'Engraved wooden memory box.',
                            'price' => 34.99,
                            'sale' => 29.99,
                            'sku' => 'NV-KSP-BOX',
                            'tags' => ['keepsake', 'box', 'wood']
                        ]
                    ]
                ]
            ],
            'Office Supplies' => [
                'seller' => ['name' => 'Stationery Junction', 'email' => 'office-seller@example.com', 'brand' => 'WorkSpace', 'city' => 'Philadelphia', 'state' => 'PA', 'zip' => '19101'],
                'subs' => [
                    'Stationery' => [
                        [
                            'name' => 'Fine Liner Colors Gel Pen Set',
                            'desc' => '0.4mm super fine point colored markers. Quick drying, smear-free. Perfect for planners and journaling.',
                            'short' => 'Fine point gel pens set.',
                            'price' => 16.99,
                            'sale' => 12.99,
                            'sku' => 'OF-PEN-GEL',
                            'tags' => ['pens', 'markers', 'writing']
                        ]
                    ],
                    'Planners' => [
                        [
                            'name' => 'Undated Daily Productivity Planner',
                            'desc' => 'Hardcover undated personal productivity planner. Prioritize tasks, set goals, and reflect daily.',
                            'short' => 'Undated goal planner.',
                            'price' => 22.99,
                            'sale' => 18.99,
                            'sku' => 'OF-PLN-PRO',
                            'tags' => ['planner', 'journal', 'productivity']
                        ]
                    ]
                ]
            ],
            'Pet Supplies' => [
                'seller' => ['name' => 'Furry Friends Emporium', 'email' => 'pet-seller@example.com', 'brand' => 'HappyTail', 'city' => 'Phoenix', 'state' => 'AZ', 'zip' => '85001'],
                'subs' => [
                    'Dog Food' => [
                        [
                            'name' => 'Grain-Free Dry Dog Food (24 lbs)',
                            'desc' => 'Premium grain-free salmon and sweet potato dry dog food. High protein for active energy.',
                            'short' => 'Grain-free salmon dog food.',
                            'price' => 54.99,
                            'sale' => 48.99,
                            'sku' => 'PT-DOG-SLM',
                            'tags' => ['dogfood', 'petfood', 'salmon']
                        ]
                    ],
                    'Cat Toys' => [
                        [
                            'name' => 'Interactive Feather Rotating Cat Toy',
                            'desc' => '360-degree rotating laser and feather pet toy. Automatic smart timer turns off after 15 mins.',
                            'short' => 'Automatic rotating cat toy.',
                            'price' => 22.50,
                            'sale' => 18.99,
                            'sku' => 'PT-CAT-RTR',
                            'tags' => ['cattoy', 'rotating', 'laser']
                        ]
                    ]
                ]
            ],
            'Quick Tools' => [
                'seller' => ['name' => 'Speedy Hardware Shop', 'email' => 'qtools-seller@example.com', 'brand' => 'SwiftFix', 'city' => 'San Francisco', 'state' => 'CA', 'zip' => '94101'],
                'subs' => [
                    'Utility Knives' => [
                        [
                            'name' => 'Heavy-Duty Retractable Utility Knife',
                            'desc' => 'Zinc alloy cast utility knife with 3-position retractable blades and comfortable ergonomic grip.',
                            'short' => 'Retractable utility knife.',
                            'price' => 14.99,
                            'sale' => 11.99,
                            'sku' => 'QT-KNF-HD',
                            'tags' => ['utilityknife', 'cutter', 'blade']
                        ]
                    ],
                    'Tape Measures' => [
                        [
                            'name' => '25ft Magnetic Heavy-Duty Tape Measure',
                            'desc' => 'Impact-resistant rubber case tape measure. Double sided markings, magnetic hooks, and auto-lock.',
                            'short' => '25ft magnetic tape measure.',
                            'price' => 16.99,
                            'sale' => 13.99,
                            'sku' => 'QT-TAP-25',
                            'tags' => ['tapemeasure', 'hardware', 'measuring']
                        ]
                    ]
                ]
            ],
            'Recreation & Sports' => [
                'seller' => ['name' => 'Outdoors Recreation Supply', 'email' => 'sports-seller@example.com', 'brand' => 'ActiveFit', 'city' => 'Boulder', 'state' => 'CO', 'zip' => '80301'],
                'subs' => [
                    'Fitness Gear' => [
                        [
                            'name' => 'Adjustable Dumbbells Set (50lbs)',
                            'desc' => 'Compact adjustable selector dumbbell pair. Transition weights from 5 to 25 lbs easily.',
                            'short' => 'Adjustable dumbbells pair.',
                            'price' => 220.00,
                            'sale' => 199.99,
                            'sku' => 'SP-FT-DBL',
                            'tags' => ['dumbbells', 'fitness', 'weights']
                        ]
                    ],
                    'Camping Equipment' => [
                        [
                            'name' => 'Ultralight Self-Inflating Sleeping Pad',
                            'desc' => 'Compact 2-inch camping sleeping pad with memory foam core and weather-resistant nylon shell.',
                            'short' => 'Self-inflating sleeping pad.',
                            'price' => 45.00,
                            'sale' => 38.99,
                            'sku' => 'SP-CP-PAD',
                            'tags' => ['sleepingpad', 'camping', 'foam']
                        ]
                    ]
                ]
            ],
            'Software' => [
                'seller' => ['name' => 'SoftSphere Tech Group', 'email' => 'software-seller@example.com', 'brand' => 'SoftSphere', 'city' => 'Redmond', 'state' => 'WA', 'zip' => '98052'],
                'subs' => [
                    'Operating Systems' => [
                        [
                            'name' => 'MyStore OS Pro Edition',
                            'desc' => 'Lightweight developer-optimized desktop operating system with native Docker and WSL compilation cores.',
                            'short' => 'Developer desktop OS.',
                            'price' => 119.99,
                            'sale' => 99.99,
                            'sku' => 'SW-OS-PRO',
                            'tags' => ['operating system', 'os', 'software']
                        ]
                    ],
                    'Productivity Apps' => [
                        [
                            'name' => 'TaskFlow Personal Productivity Suite',
                            'desc' => 'Integrates Kanban boards, calendar triggers, time sheets, and markdown documentation hubs offline.',
                            'short' => 'TaskFlow desktop app.',
                            'price' => 59.99,
                            'sale' => 49.99,
                            'sku' => 'SW-APP-TKF',
                            'tags' => ['productivity', 'kanban', 'app']
                        ]
                    ]
                ]
            ],
            'Travel & Outdoors' => [
                'seller' => ['name' => 'Backcountry Trail Blazers', 'email' => 'travel-seller@example.com', 'brand' => 'OutwardBound', 'city' => 'Portland', 'state' => 'OR', 'zip' => '97201'],
                'subs' => [
                    'Tents' => [
                        [
                            'name' => '4-Person Waterproof Instant Camping Tent',
                            'desc' => 'Double-layer waterproof dome tent. Sets up in under 2 minutes with pre-assembled telescopic poles.',
                            'short' => '4-person instant tent.',
                            'price' => 110.00,
                            'sale' => 95.00,
                            'sku' => 'TR-TNT-4P',
                            'tags' => ['tent', 'camping', 'outdoor']
                        ]
                    ],
                    'Backpacking Gear' => [
                        [
                            'name' => 'Carbon Fiber Anti-Shock Trekking Poles',
                            'desc' => 'Pair of retractable carbon fiber walking sticks. Shock-absorbent rings, comfortable cork handles.',
                            'short' => 'Carbon fiber trekking poles.',
                            'price' => 49.99,
                            'sale' => 39.99,
                            'sku' => 'TR-GE-PL',
                            'tags' => ['trekkingpoles', 'hiking', 'gear']
                        ]
                    ]
                ]
            ],
            'Utilities & Hardware' => [
                'seller' => ['name' => 'Home Power & Grid', 'email' => 'util-seller@example.com', 'brand' => 'PowerGrid', 'city' => 'Pittsburgh', 'state' => 'PA', 'zip' => '15201'],
                'subs' => [
                    'Plugs' => [
                        [
                            'name' => 'Smart Wi-Fi Power Outlets (4-Pack)',
                            'desc' => 'Wired smart plugs compatible with Alexa and Google Home. Schedule timers and track energy consumption.',
                            'short' => 'Smart Wi-Fi plugs 4-pack.',
                            'price' => 29.99,
                            'sale' => 24.99,
                            'sku' => 'UT-PLG-SMT',
                            'tags' => ['smartplug', 'wifi', 'outlet']
                        ]
                    ],
                    'Light Bulbs' => [
                        [
                            'name' => 'Energy Saving LED Bulbs A19 (6-Pack)',
                            'desc' => 'Standard replacement A19 light bulbs. Warm white 2700K illumination, 8.5W replaces 60W incandescent.',
                            'short' => 'LED light bulbs 6-pack.',
                            'price' => 15.99,
                            'sale' => 12.99,
                            'sku' => 'UT-BLB-LED',
                            'tags' => ['lightbulb', 'led', 'energy-saving']
                        ]
                    ]
                ]
            ],
            'Video Games' => [
                'seller' => ['name' => 'Pixel Power Gaming', 'email' => 'games-seller@example.com', 'brand' => 'PixelPower', 'city' => 'Atlanta', 'state' => 'GA', 'zip' => '30301'],
                'subs' => [
                    'Consoles' => [
                        [
                            'name' => 'Next-Gen Pixel Console (1TB)',
                            'desc' => 'High-end gaming console pushing 4K resolution at 120 FPS. Includes wireless gamepad controller.',
                            'short' => 'Next-gen 4K game console.',
                            'price' => 499.00,
                            'sale' => 449.00,
                            'sku' => 'VG-CON-PX',
                            'tags' => ['console', 'gaming', '4k']
                        ]
                    ],
                    'Game Discs' => [
                        [
                            'name' => 'CyberQuest Action RPG Game Disc',
                            'desc' => 'Explore massive cyberpunk open-world maps. Immersive futuristic storyline, custom class upgrades.',
                            'short' => 'CyberQuest RPG game disc.',
                            'price' => 59.99,
                            'sale' => 49.99,
                            'sku' => 'VG-DSC-CYB',
                            'tags' => ['rpg', 'gamedisc', 'cyberpunk']
                        ]
                    ]
                ]
            ],
            'Wellness & Cosmetics' => [
                'seller' => ['name' => 'Pure Glow Apothecary', 'email' => 'wellness-seller@example.com', 'brand' => 'PureGlow', 'city' => 'Las Vegas', 'state' => 'NV', 'zip' => '89101'],
                'subs' => [
                    'Makeup' => [
                        [
                            'name' => 'Matte Liquid Longwear Lipstick Set',
                            'desc' => 'Lipstick kit with 6 highly pigmented, smudge-resistant matte shades. Non-drying velvet finish.',
                            'short' => 'Matte liquid lipsticks set.',
                            'price' => 28.00,
                            'sale' => 22.50,
                            'sku' => 'WL-MKP-LIP',
                            'tags' => ['makeup', 'lipstick', 'matte']
                        ]
                    ],
                    'Health Supplements' => [
                        [
                            'name' => 'Organic Multivitamin Capsules',
                            'desc' => '120 vegetable capsules containing organic whole-food extracts, minerals, and digestive enzymes.',
                            'short' => 'Whole-food organic multivitamins.',
                            'price' => 32.00,
                            'sale' => 27.99,
                            'sku' => 'WL-SPL-VIT',
                            'tags' => ['vitamins', 'supplement', 'organic']
                        ]
                    ]
                ]
            ],
            'Xerox & Paper' => [
                'seller' => ['name' => 'Copy Cat Stationery', 'email' => 'paper-seller@example.com', 'brand' => 'CopyCat', 'city' => 'Charlotte', 'state' => 'NC', 'zip' => '28201'],
                'subs' => [
                    'Printing Paper' => [
                        [
                            'name' => 'Premium A4 Copier Printing Paper',
                            'desc' => 'High brightness 20 lb copier printing paper. Perfect for office photocopy grids and letters.',
                            'short' => 'Premium A4 paper ream.',
                            'price' => 12.99,
                            'sale' => 9.99,
                            'sku' => 'XP-PPR-A4',
                            'tags' => ['paper', 'printing', 'office']
                        ]
                    ],
                    'Notebooks' => [
                        [
                            'name' => 'A5 Hardcover Dotted Grid Notebook',
                            'desc' => 'Classic hardcover dotted grid bullet journal notebook with thick bleed-proof ivory paper pages.',
                            'short' => 'A5 dotted grid notebook.',
                            'price' => 15.99,
                            'sale' => 12.99,
                            'sku' => 'XP-NTB-A5',
                            'tags' => ['notebook', 'journal', 'dotted']
                        ]
                    ]
                ]
            ],
            'Yard & Garden' => [
                'seller' => ['name' => 'Green Thumb Nursery', 'email' => 'yard-seller@example.com', 'brand' => 'GreenThumb', 'city' => 'Atlanta', 'state' => 'GA', 'zip' => '30302'],
                'subs' => [
                    'Gardening Tools' => [
                        [
                            'name' => 'Ergonomic Hand Trowel & Pruner Set',
                            'desc' => 'Heavy-duty steel garden tools set. Ergonomic non-slip grips, rust-resistant blade finish.',
                            'short' => 'Trowel & bypass pruner set.',
                            'price' => 29.99,
                            'sale' => 24.99,
                            'sku' => 'YD-TL-SET',
                            'tags' => ['gardentools', 'trowel', 'pruner']
                        ]
                    ],
                    'Seeds' => [
                        [
                            'name' => 'Wildflower Seed Packet Assortment',
                            'desc' => 'Over 15 distinct species of wild flower seeds. Great for bees, butterflies, and yard displays.',
                            'short' => '15 varieties wildflower seeds.',
                            'price' => 18.00,
                            'sale' => 14.99,
                            'sku' => 'YD-SD-WLD',
                            'tags' => ['seeds', 'wildflower', 'garden']
                        ]
                    ]
                ]
            ],
            'Zero-Waste & Eco' => [
                'seller' => ['name' => 'Earth First Eco Shop', 'email' => 'eco-seller@example.com', 'brand' => 'EarthFirst', 'city' => 'Seattle', 'state' => 'WA', 'zip' => '98102'],
                'subs' => [
                    'Reusable Bottles' => [
                        [
                            'name' => 'Vacuum Insulated Stainless Steel Bottle',
                            'desc' => 'Double-walled vacuum insulated water bottle. Keeps drinks cold for 24 hours or hot for 12 hours.',
                            'short' => '32oz double-walled bottle.',
                            'price' => 29.99,
                            'sale' => 24.99,
                            'sku' => 'ZW-BTL-SS',
                            'tags' => ['waterbottle', 'insulated', 'stainless']
                        ]
                    ],
                    'Bamboo Products' => [
                        [
                            'name' => 'Eco-Friendly Bamboo Toothbrushes',
                            'desc' => '100% biodegradable organic bamboo toothbrushes set with soft BPA-free charcoal bristles.',
                            'short' => 'Bamboo toothbrushes 4-pack.',
                            'price' => 9.99,
                            'sale' => 7.99,
                            'sku' => 'ZW-BAM-TBS',
                            'tags' => ['toothbrush', 'bamboo', 'biodegradable']
                        ]
                    ]
                ]
            ]
        ];

        $indianLocations = [
            ['city' => 'Ahmedabad', 'state' => 'Gujarat', 'zip' => '380015', 'gstin' => '24AAAAB1234C1Z0'],
            ['city' => 'Surat', 'state' => 'Gujarat', 'zip' => '395007', 'gstin' => '24BBBBB1234D1Z1'],
            ['city' => 'Vadodara', 'state' => 'Gujarat', 'zip' => '390001', 'gstin' => '24CCCCC1234E1Z2'],
            ['city' => 'Rajkot', 'state' => 'Gujarat', 'zip' => '360001', 'gstin' => '24DDDDD1234F1Z3'],
            ['city' => 'Mumbai', 'state' => 'Maharashtra', 'zip' => '400001', 'gstin' => '27EEEEE1234G1Z4'],
            ['city' => 'Pune', 'state' => 'Maharashtra', 'zip' => '411001', 'gstin' => '27FFFFF1234H1Z5'],
            ['city' => 'Nagpur', 'state' => 'Maharashtra', 'zip' => '440001', 'gstin' => '27GGGGG1234I1Z6'],
            ['city' => 'Delhi', 'state' => 'Delhi', 'zip' => '110001', 'gstin' => '07HHHHH1234J1Z7'],
            ['city' => 'Bangalore', 'state' => 'Karnataka', 'zip' => '560001', 'gstin' => '29IIIII1234K1Z8'],
            ['city' => 'Chennai', 'state' => 'Tamil Nadu', 'zip' => '600001', 'gstin' => '33JJJJJ1234L1Z9'],
            ['city' => 'Hyderabad', 'state' => 'Telangana', 'zip' => '500001', 'gstin' => '36KKKKK1234M1ZA'],
            ['city' => 'Kolkata', 'state' => 'West Bengal', 'zip' => '700001', 'gstin' => '19LLLLL1234N1ZB'],
            ['city' => 'Jaipur', 'state' => 'Rajasthan', 'zip' => '302001', 'gstin' => '08MMMMM1234O1ZC'],
            ['city' => 'Indore', 'state' => 'Madhya Pradesh', 'zip' => '452001', 'gstin' => '23NNNNN1234P1ZD'],
            ['city' => 'Bhopal', 'state' => 'Madhya Pradesh', 'zip' => '462001', 'gstin' => '23OOOOO1234Q1ZE'],
            ['city' => 'Lucknow', 'state' => 'Uttar Pradesh', 'zip' => '226001', 'gstin' => '09PPPPP1234R1ZF'],
            ['city' => 'Kanpur', 'state' => 'Uttar Pradesh', 'zip' => '208001', 'gstin' => '09QQQQQ1234S1ZG'],
            ['city' => 'Patna', 'state' => 'Bihar', 'zip' => '800001', 'gstin' => '10RRRRR1234T1ZH'],
            ['city' => 'Ranchi', 'state' => 'Jharkhand', 'zip' => '834001', 'gstin' => '20SSSSS1234U1ZI'],
            ['city' => 'Guwahati', 'state' => 'Assam', 'zip' => '781001', 'gstin' => '18TTTTT1234V1ZJ'],
            ['city' => 'Bhubaneswar', 'state' => 'Odisha', 'zip' => '751001', 'gstin' => '21UUUUU1234W1ZK'],
            ['city' => 'Chandigarh', 'state' => 'Chandigarh', 'zip' => '160017', 'gstin' => '04VVVVV1234X1ZL'],
            ['city' => 'Dehradun', 'state' => 'Uttarakhand', 'zip' => '248001', 'gstin' => '05WWWWW1234Y1ZM'],
            ['city' => 'Jammu', 'state' => 'Jammu & Kashmir', 'zip' => '180001', 'gstin' => '01XXXXX1234Z1ZN'],
            ['city' => 'Kochi', 'state' => 'Kerala', 'zip' => '682001', 'gstin' => '32YYYYY1234A1ZO'],
            ['city' => 'Panaji', 'state' => 'Goa', 'zip' => '403001', 'gstin' => '30ZZZZZ1234B1ZP'],
        ];

        $idx = 0;
        foreach ($categoryData as $parentCatName => $data) {
            $sellerInfo = $data['seller'];
            $loc = $indianLocations[$idx % count($indianLocations)];
            $idx++;

            // Create verified Category Seller
            $seller = User::create([
                'name' => $sellerInfo['name'],
                'email' => $sellerInfo['email'],
                'email_verified_at' => now(),
                'phone' => '+91' . mt_rand(7000000000, 9999999999),
                'password' => Hash::make('password'),
                'role' => 'seller',
                'brand_name' => $sellerInfo['brand'] . ' Brand',
                'gst_number' => $loc['gstin'],
                'address' => '500 Marketplace Blvd, ' . $loc['city'] . ', ' . $loc['state'] . ' - ' . $loc['zip'],
                'country' => 'India',
                'fulfillment_channels' => ['Seller Fulfilled', 'Local Courier', 'Marketplace Managed'],
                'default_fulfillment_channel' => 'Seller Fulfilled',
                'shipping_acceptance_time' => '2 hours',
                'handling_time_business_days' => 1,
            ]);

            // Create Brand for Seller
            $brand = Brand::create([
                'user_id' => $seller->id,
                'name' => $sellerInfo['brand'],
                'slug' => Str::slug($sellerInfo['brand']),
                'logo' => null
            ]);

            // Create Warehouse for Seller
            $warehouse = Warehouse::create([
                'user_id' => $seller->id,
                'name' => $sellerInfo['brand'] . ' Hub ' . $loc['state'],
                'code' => 'WH-' . strtoupper(substr($sellerInfo['brand'], 0, 3)) . '-' . strtoupper(substr($loc['state'], 0, 2)),
                'address' => '100 Industrial Parkway',
                'city' => $loc['city'],
                'state' => $loc['state'],
                'postal_code' => $loc['zip'],
                'default_carrier' => 'Seller Fulfilled'
            ]);

            // Create Parent Category
            $parentCategory = Category::create([
                'user_id' => $seller->id,
                'name' => $parentCatName,
                'slug' => Str::slug($parentCatName) . '-' . uniqid(),
                'parent_id' => null
            ]);

            // Create child categories and seed their products
            foreach ($data['subs'] as $subCatName => $productsList) {
                $childCategory = Category::create([
                    'user_id' => $seller->id,
                    'name' => $subCatName,
                    'slug' => Str::slug($subCatName) . '-' . uniqid(),
                    'parent_id' => $parentCategory->id
                ]);

                foreach ($productsList as $pData) {
                    $product = Product::create([
                        'user_id' => $seller->id,
                        'brand_id' => $brand->id,
                        'name' => $pData['name'],
                        'slug' => Str::slug($pData['name']) . '-' . uniqid(),
                        'description' => $pData['desc'],
                        'short_description' => $pData['short'],
                        'status' => 'published',
                        'manufacturer' => $sellerInfo['brand'],
                        'country_of_origin' => 'India',
                        'product_type' => $subCatName,
                        'product_type_keyword' => implode(', ', $pData['tags']),
                        'target_gender' => 'Unisex',
                        'recommended_age' => str_contains(strtolower($parentCatName), 'baby') ? '0 months and up' : '12 years and up',
                        'condition' => 'new',
                        'fulfillment_channel' => 'Seller Fulfilled',
                        'bullet_points' => [
                            ['title' => 'Description', 'value' => $pData['short']],
                            ['title' => 'Material', 'value' => 'Quality-tested marketplace item from a verified seller.'],
                            ['title' => 'Warranty', 'value' => 'Seller support available for eligible issues.'],
                        ],
                        'seo_search_terms' => $pData['tags'],
                        'whats_inside_box' => ['1 x ' . $pData['name']],
                        'regular_price' => $pData['price'],
                        'sale_price' => $pData['sale'],
                        'sku' => $pData['sku'],
                        'manage_stock' => true,
                        'stock_quantity' => mt_rand(20, 100),
                        'stock_status' => 'instock',
                        'type' => 'simple',
                        'tags' => $pData['tags'],
                        'weight_kg' => mt_rand(5, 50) / 10,
                        'length_cm' => mt_rand(10, 50),
                        'width_cm' => mt_rand(10, 40),
                        'height_cm' => mt_rand(5, 30),
                        'package_weight_kg' => mt_rand(6, 60) / 10,
                        'package_length_cm' => mt_rand(12, 55),
                        'package_width_cm' => mt_rand(12, 45),
                        'package_height_cm' => mt_rand(8, 35),
                    ]);

                    $product->categories()->attach([$childCategory->id, $parentCategory->id]);
                    $product->warehouses()->attach($warehouse, [
                        'quantity' => $product->stock_quantity,
                        'bin_location' => chr(mt_rand(65, 90)) . '-' . mt_rand(1, 20)
                    ]);
                }
            }

            // Custom Sub-subcategories (Laptops & Jackets)
            if ($parentCatName === 'Computers & Electronics') {
                $laptopsSubCategory = Category::where('name', 'Laptops')->where('parent_id', $parentCategory->id)->first();
                if ($laptopsSubCategory) {
                    // Create sub-subcategories
                    $businessLaptops = Category::create([
                        'user_id' => $seller->id,
                        'name' => 'Business Laptops',
                        'slug' => 'business-laptops-' . uniqid(),
                        'parent_id' => $laptopsSubCategory->id
                    ]);

                    $gamingLaptops = Category::create([
                        'user_id' => $seller->id,
                        'name' => 'Gaming Laptops',
                        'slug' => 'gaming-laptops-' . uniqid(),
                        'parent_id' => $laptopsSubCategory->id
                    ]);

                    // Seed Business Laptop
                    $pLaptop1 = Product::create([
                        'user_id' => $seller->id,
                        'brand_id' => $brand->id,
                        'name' => 'SuperBook Pro 15',
                        'slug' => 'superbook-pro-15-' . uniqid(),
                        'description' => 'A high performance workstation laptop with 32GB RAM, 1TB SSD, and an ultra-sharp Retina display.',
                        'short_description' => 'High-end developer laptop.',
                        'status' => 'published',
                        'regular_price' => 1499.99,
                        'sale_price' => 1399.99,
                        'sku' => 'SB-PRO-15',
                        'manage_stock' => true,
                        'stock_quantity' => 25,
                        'stock_status' => 'instock',
                        'type' => 'simple',
                        'tags' => ['laptop', 'workstation', 'pro'],
                        'weight_kg' => 1.8,
                        'length_cm' => 35,
                        'width_cm' => 24,
                        'height_cm' => 2
                    ]);
                    $pLaptop1->categories()->attach([$businessLaptops->id, $laptopsSubCategory->id, $parentCategory->id]);
                    $pLaptop1->warehouses()->attach($warehouse, ['quantity' => 25, 'bin_location' => 'A-12']);

                    // Seed Gaming Laptop
                    $pLaptop2 = Product::create([
                        'user_id' => $seller->id,
                        'brand_id' => $brand->id,
                        'name' => 'Rogue Gaming Laptop 17',
                        'slug' => 'rogue-gaming-laptop-17-' . uniqid(),
                        'description' => 'Heavyweight gaming rig with RTX 4080 graphics, Intel i9 CPU, 17.3-inch 240Hz screen, and custom RGB thermals.',
                        'short_description' => 'Flagship 17-inch gaming laptop.',
                        'status' => 'published',
                        'regular_price' => 1899.99,
                        'sale_price' => null,
                        'sku' => 'ROG-GAM-17',
                        'manage_stock' => true,
                        'stock_quantity' => 15,
                        'stock_status' => 'instock',
                        'type' => 'simple',
                        'tags' => ['laptop', 'gaming', 'rogue'],
                        'weight_kg' => 3.2,
                        'length_cm' => 40,
                        'width_cm' => 28,
                        'height_cm' => 3
                    ]);
                    $pLaptop2->categories()->attach([$gamingLaptops->id, $laptopsSubCategory->id, $parentCategory->id]);
                    $pLaptop2->warehouses()->attach($warehouse, ['quantity' => 15, 'bin_location' => 'G-04']);
                }
            }

            if ($parentCatName === 'Fashion & Apparel') {
                $jacketsSubCategory = Category::create([
                    'user_id' => $seller->id,
                    'name' => 'Jackets',
                    'slug' => 'jackets-' . uniqid(),
                    'parent_id' => $parentCategory->id
                ]);

                $denimJackets = Category::create([
                    'user_id' => $seller->id,
                    'name' => 'Denim Jackets',
                    'slug' => 'denim-jackets-' . uniqid(),
                    'parent_id' => $jacketsSubCategory->id
                ]);

                $leatherJackets = Category::create([
                    'user_id' => $seller->id,
                    'name' => 'Leather Jackets',
                    'slug' => 'leather-jackets-' . uniqid(),
                    'parent_id' => $jacketsSubCategory->id
                ]);

                // Denim Jacket
                $pJacket1 = Product::create([
                    'user_id' => $seller->id,
                    'brand_id' => $brand->id,
                    'name' => 'Classic Denim Jacket',
                    'slug' => 'classic-denim-jacket-' . uniqid(),
                    'description' => 'Timeless denim jacket made with 100% premium cotton, vintage wash, and heavy-duty metal buttons.',
                    'short_description' => 'Premium vintage denim jacket.',
                    'status' => 'published',
                    'regular_price' => 89.99,
                    'sale_price' => 74.99,
                    'sku' => 'UT-DEN-JK',
                    'manage_stock' => true,
                    'stock_quantity' => 15,
                    'stock_status' => 'instock',
                    'type' => 'simple',
                    'tags' => ['jacket', 'denim', 'vintage'],
                    'weight_kg' => 0.8,
                    'length_cm' => 30,
                    'width_cm' => 20,
                    'height_cm' => 5
                ]);
                $pJacket1->categories()->attach([$denimJackets->id, $jacketsSubCategory->id, $parentCategory->id]);
                $pJacket1->warehouses()->attach($warehouse, ['quantity' => 15, 'bin_location' => 'J-10']);

                // Leather Jacket
                $pJacket2 = Product::create([
                    'user_id' => $seller->id,
                    'brand_id' => $brand->id,
                    'name' => 'Vintage Leather Biker Jacket',
                    'slug' => 'vintage-leather-jacket-' . uniqid(),
                    'description' => 'Genuine cowhide leather biker jacket with asymmetrical heavy zippers, metal press studs, and quilted interior lining.',
                    'short_description' => 'Genuine black leather jacket.',
                    'status' => 'published',
                    'regular_price' => 199.99,
                    'sale_price' => 179.99,
                    'sku' => 'UT-LTH-JK',
                    'manage_stock' => true,
                    'stock_quantity' => 8,
                    'stock_status' => 'instock',
                    'type' => 'simple',
                    'tags' => ['jacket', 'leather', 'biker'],
                    'weight_kg' => 1.5,
                    'length_cm' => 32,
                    'width_cm' => 22,
                    'height_cm' => 6
                ]);
                $pJacket2->categories()->attach([$leatherJackets->id, $jacketsSubCategory->id, $parentCategory->id]);
                $pJacket2->warehouses()->attach($warehouse, ['quantity' => 8, 'bin_location' => 'L-01']);
            }
        }

        // 4. Seed Standard Coupons
        \App\Models\Coupon::create([
            'code' => 'SAVE10',
            'type' => 'percent',
            'value' => 10.00,
            'expiry_date' => now()->addDays(30)->toDateString(),
            'min_spend' => 0.00,
            'active' => true
        ]);

        \App\Models\Coupon::create([
            'code' => 'FREESHIP',
            'type' => 'fixed',
            'value' => 10.00,
            'expiry_date' => now()->addDays(30)->toDateString(),
            'min_spend' => 50.00,
            'active' => true
        ]);

        \App\Models\Coupon::create([
            'code' => 'SUPERDEAL',
            'type' => 'percent',
            'value' => 20.00,
            'expiry_date' => now()->addDays(14)->toDateString(),
            'min_spend' => 100.00,
            'active' => true
        ]);
    }
}
