/**
 * India States and Districts Data for ODOP
 * Contains all 28 states + 8 UTs with their districts
 */

export interface District {
  name: string;
  famousFor?: string[];  // ODOP products this district is famous for
}

export interface State {
  code: string;
  name: string;
  districts: District[];
}

// Famous ODOP products by region (for reference)
export const FAMOUS_ODOP_PRODUCTS: { [key: string]: string[] } = {
  'Kashmir': ['Saffron', 'Kashmiri Shawl', 'Walnut Wood Craft', 'Papier-mâché'],
  'Punjab': ['Phulkari', 'Jutti', 'Sports Goods'],
  'Rajasthan': ['Marble', 'Blue Pottery', 'Bandhani', 'Leather Goods'],
  'Gujarat': ['Patola Silk', 'Kutch Embroidery', 'Bandhani'],
  'Maharashtra': ['Nagpur Orange', 'Kolhapuri Chappal', 'Paithani Saree'],
  'Bihar': ['Madhubani Painting', 'Silk', 'Makhana'],
  'West Bengal': ['Darjeeling Tea', 'Terracotta', 'Kantha Stitch'],
  'Assam': ['Assam Tea', 'Muga Silk', 'Bamboo Craft'],
  'Tamil Nadu': ['Kanchipuram Silk', 'Bronze Sculpture', 'Chettinad Tiles'],
  'Kerala': ['Spices', 'Coir Products', 'Kathakali Masks'],
  'Karnataka': ['Mysore Silk', 'Sandalwood', 'Bidriware'],
  'Andhra Pradesh': ['Kalamkari', 'Kondapalli Toys', 'Tirupati Laddu'],
  'Telangana': ['Pochampally Ikat', 'Nirmal Toys', 'Bidriware'],
  'Odisha': ['Pattachitra', 'Sambalpuri Saree', 'Dhokra Art'],
  'Madhya Pradesh': ['Chanderi Silk', 'Gond Art', 'Bagh Print'],
  'Uttar Pradesh': ['Banarasi Silk', 'Chikankari', 'Brass Items'],
  'Uttarakhand': ['Aipan Art', 'Ringal Craft', 'Wool Products'],
  'Himachal Pradesh': ['Kullu Shawl', 'Chamba Rumal', 'Kangra Painting'],
};

export const INDIA_STATES: State[] = [
  {
    code: 'AN', name: 'Andaman and Nicobar Islands',
    districts: [{ name: 'Nicobar' }, { name: 'North and Middle Andaman' }, { name: 'South Andaman' }]
  },
  {
    code: 'AP', name: 'Andhra Pradesh',
    districts: [
      { name: 'Anantapur' }, { name: 'Chittoor' }, { name: 'East Godavari' },
      { name: 'Guntur' }, { name: 'Krishna' }, { name: 'Kurnool' },
      { name: 'Nellore' }, { name: 'Prakasam' }, { name: 'Srikakulam' },
      { name: 'Visakhapatnam' }, { name: 'Vizianagaram' }, { name: 'West Godavari' },
      { name: 'YSR Kadapa' }
    ]
  },
  {
    code: 'AR', name: 'Arunachal Pradesh',
    districts: [
      { name: 'Anjaw' }, { name: 'Changlang' }, { name: 'East Kameng' },
      { name: 'East Siang' }, { name: 'Itanagar' }, { name: 'Kurung Kumey' },
      { name: 'Lohit' }, { name: 'Lower Subansiri' }, { name: 'Papum Pare' },
      { name: 'Tawang' }, { name: 'Tirap' }, { name: 'Upper Siang' },
      { name: 'Upper Subansiri' }, { name: 'West Kameng' }, { name: 'West Siang' }
    ]
  },
  {
    code: 'AS', name: 'Assam',
    districts: [
      { name: 'Baksa' }, { name: 'Barpeta' }, { name: 'Bongaigaon' },
      { name: 'Cachar' }, { name: 'Chirang' }, { name: 'Darrang' },
      { name: 'Dhemaji' }, { name: 'Dhubri' }, { name: 'Dibrugarh', famousFor: ['Assam Tea'] },
      { name: 'Goalpara' }, { name: 'Golaghat' }, { name: 'Hailakandi' },
      { name: 'Jorhat', famousFor: ['Assam Tea', 'Muga Silk'] }, { name: 'Kamrup' },
      { name: 'Kamrup Metropolitan' }, { name: 'Karbi Anglong' }, { name: 'Karimganj' },
      { name: 'Kokrajhar' }, { name: 'Lakhimpur' }, { name: 'Morigaon' },
      { name: 'Nagaon' }, { name: 'Nalbari' }, { name: 'Sivasagar', famousFor: ['Muga Silk'] },
      { name: 'Sonitpur' }, { name: 'Tinsukia' }, { name: 'Udalguri' }
    ]
  },
  {
    code: 'BR', name: 'Bihar',
    districts: [
      { name: 'Araria' }, { name: 'Arwal' }, { name: 'Aurangabad' },
      { name: 'Banka' }, { name: 'Begusarai' }, { name: 'Bhagalpur', famousFor: ['Bhagalpuri Silk'] },
      { name: 'Bhojpur' }, { name: 'Buxar' }, { name: 'Darbhanga', famousFor: ['Makhana'] },
      { name: 'East Champaran' }, { name: 'Gaya' }, { name: 'Gopalganj' },
      { name: 'Jamui' }, { name: 'Jehanabad' }, { name: 'Kaimur' },
      { name: 'Katihar' }, { name: 'Khagaria' }, { name: 'Kishanganj' },
      { name: 'Lakhisarai' }, { name: 'Madhepura' }, { name: 'Madhubani', famousFor: ['Madhubani Painting'] },
      { name: 'Munger' }, { name: 'Muzaffarpur', famousFor: ['Shahi Litchi'] },
      { name: 'Nalanda' }, { name: 'Nawada' }, { name: 'Patna' },
      { name: 'Purnia' }, { name: 'Rohtas' }, { name: 'Saharsa' },
      { name: 'Samastipur' }, { name: 'Saran' }, { name: 'Sheikhpura' },
      { name: 'Sheohar' }, { name: 'Sitamarhi' }, { name: 'Siwan' },
      { name: 'Supaul' }, { name: 'Vaishali' }, { name: 'West Champaran' }
    ]
  },
  {
    code: 'CH', name: 'Chandigarh',
    districts: [{ name: 'Chandigarh' }]
  },
  {
    code: 'CT', name: 'Chhattisgarh',
    districts: [
      { name: 'Balod' }, { name: 'Baloda Bazar' }, { name: 'Balrampur' },
      { name: 'Bastar', famousFor: ['Bastar Art', 'Dhokra'] }, { name: 'Bemetara' },
      { name: 'Bijapur' }, { name: 'Bilaspur' }, { name: 'Dantewada' },
      { name: 'Dhamtari' }, { name: 'Durg' }, { name: 'Gariaband' },
      { name: 'Janjgir-Champa' }, { name: 'Jashpur' }, { name: 'Kabirdham' },
      { name: 'Kanker' }, { name: 'Kondagaon', famousFor: ['Bell Metal Craft'] },
      { name: 'Korba' }, { name: 'Koriya' }, { name: 'Mahasamund' },
      { name: 'Mungeli' }, { name: 'Narayanpur' }, { name: 'Raigarh' },
      { name: 'Raipur' }, { name: 'Rajnandgaon' }, { name: 'Sukma' },
      { name: 'Surajpur' }, { name: 'Surguja' }
    ]
  },
  {
    code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu',
    districts: [{ name: 'Dadra and Nagar Haveli' }, { name: 'Daman' }, { name: 'Diu' }]
  },
  {
    code: 'DL', name: 'Delhi',
    districts: [
      { name: 'Central Delhi' }, { name: 'East Delhi' }, { name: 'New Delhi' },
      { name: 'North Delhi' }, { name: 'North East Delhi' }, { name: 'North West Delhi' },
      { name: 'Shahdara' }, { name: 'South Delhi' }, { name: 'South East Delhi' },
      { name: 'South West Delhi' }, { name: 'West Delhi' }
    ]
  },
  {
    code: 'GA', name: 'Goa',
    districts: [{ name: 'North Goa' }, { name: 'South Goa' }]
  },
  {
    code: 'GJ', name: 'Gujarat',
    districts: [
      { name: 'Ahmedabad' }, { name: 'Amreli' }, { name: 'Anand' },
      { name: 'Aravalli' }, { name: 'Banaskantha' }, { name: 'Bharuch' },
      { name: 'Bhavnagar' }, { name: 'Botad' }, { name: 'Chhota Udaipur' },
      { name: 'Dahod' }, { name: 'Dang' }, { name: 'Devbhoomi Dwarka' },
      { name: 'Gandhinagar' }, { name: 'Gir Somnath' }, { name: 'Jamnagar' },
      { name: 'Junagadh' }, { name: 'Kheda' }, { name: 'Kutch', famousFor: ['Kutch Embroidery', 'Bandhani'] },
      { name: 'Mahisagar' }, { name: 'Mehsana' }, { name: 'Morbi' },
      { name: 'Narmada' }, { name: 'Navsari' }, { name: 'Panchmahal' },
      { name: 'Patan', famousFor: ['Patola Silk'] }, { name: 'Porbandar' },
      { name: 'Rajkot' }, { name: 'Sabarkantha' }, { name: 'Surat', famousFor: ['Diamond', 'Textile'] },
      { name: 'Surendranagar' }, { name: 'Tapi' }, { name: 'Vadodara' }, { name: 'Valsad' }
    ]
  }
];

// Continue in next file part due to size...
