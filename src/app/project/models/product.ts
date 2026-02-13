// Craft/Product types for ODOP
export type CraftType = 
  | 'handloom'        // Textiles, fabrics
  | 'handicraft'      // Handmade items
  | 'food'            // Food products
  | 'spice'           // Spices
  | 'agriculture'     // Farm products
  | 'art'             // Paintings, sculptures
  | 'jewelry'         // Ornaments
  | 'pottery'         // Clay items
  | 'leather'         // Leather goods
  | 'metal'           // Metal crafts
  | 'wood'            // Wooden items
  | 'bamboo'          // Bamboo products
  | 'other';

export class Product {
  productId?: string;
  productName?: string;
  productDescription?: string;
  categoryId?: string;
  subCategoryId?: string;
  subCategory?: string;
  price?: number;
  productQuantity?: number;
  productImageURL?: string;
  discount?: number;
  promotionEnabled?: boolean;
  specification?: string;
  warranty?: string;
  rating?: number;
  vendorId?: string;

  // This can be used to handle the base64 image representation
  productImageBase64?: string;

  // ========== ODOP Location Fields ==========
  originDistrict?: string;        // District where product originates
  originState?: string;           // State where product originates
  originPinCode?: string;         // PIN code of origin area
  localName?: string;             // Product name in local language

  // ========== GI Tag (Geographical Indication) ==========
  giTagNumber?: string;           // Official GI tag registration number
  giTagCertified?: boolean;       // Is product GI certified?
  giTagCertificateUrl?: string;   // URL to GI certificate image

  // ========== Product Origin Story ==========
  originStory?: string;           // Cultural significance & history
  craftType?: CraftType;          // Type of craft/product
  madeBy?: string;                // Artisan/maker name
  materialsUsed?: string;         // Raw materials used

  // ========== Search & Discovery ==========
  tags?: string[];                // Search tags
  popularityScore?: number;       // For "popular in area" ranking
  totalSold?: number;             // Units sold (for popularity)
  stockStatus?: string;
  approvalStatus?: string;
  isActive?: boolean;
}
  
