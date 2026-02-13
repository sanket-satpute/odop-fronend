/**
 * India States and Districts Data - Part 2
 * Remaining states from Haryana to Manipur
 */

import { State } from './india-locations';

export const INDIA_STATES_PART2: State[] = [
  {
    code: 'HR', name: 'Haryana',
    districts: [
      { name: 'Ambala' }, { name: 'Bhiwani' }, { name: 'Charkhi Dadri' },
      { name: 'Faridabad' }, { name: 'Fatehabad' }, { name: 'Gurugram' },
      { name: 'Hisar' }, { name: 'Jhajjar' }, { name: 'Jind' },
      { name: 'Kaithal' }, { name: 'Karnal' }, { name: 'Kurukshetra' },
      { name: 'Mahendragarh' }, { name: 'Nuh' }, { name: 'Palwal' },
      { name: 'Panchkula' }, { name: 'Panipat', famousFor: ['Handloom', 'Carpets'] },
      { name: 'Rewari' }, { name: 'Rohtak' }, { name: 'Sirsa' },
      { name: 'Sonipat' }, { name: 'Yamunanagar' }
    ]
  },
  {
    code: 'HP', name: 'Himachal Pradesh',
    districts: [
      { name: 'Bilaspur' }, { name: 'Chamba', famousFor: ['Chamba Rumal'] },
      { name: 'Hamirpur' }, { name: 'Kangra', famousFor: ['Kangra Painting', 'Kangra Tea'] },
      { name: 'Kinnaur', famousFor: ['Kinnauri Shawl', 'Apple'] },
      { name: 'Kullu', famousFor: ['Kullu Shawl', 'Kullu Cap'] },
      { name: 'Lahaul and Spiti' }, { name: 'Mandi' }, { name: 'Shimla' },
      { name: 'Sirmaur' }, { name: 'Solan' }, { name: 'Una' }
    ]
  },
  {
    code: 'JK', name: 'Jammu and Kashmir',
    districts: [
      { name: 'Anantnag' }, { name: 'Bandipora' }, { name: 'Baramulla' },
      { name: 'Budgam' }, { name: 'Doda' }, { name: 'Ganderbal' },
      { name: 'Jammu' }, { name: 'Kathua' }, { name: 'Kishtwar' },
      { name: 'Kulgam' }, { name: 'Kupwara' }, { name: 'Poonch' },
      { name: 'Pulwama', famousFor: ['Saffron'] },
      { name: 'Rajouri' }, { name: 'Ramban' }, { name: 'Reasi' },
      { name: 'Samba' }, { name: 'Shopian' },
      { name: 'Srinagar', famousFor: ['Kashmiri Shawl', 'Papier-mâché', 'Walnut Wood'] },
      { name: 'Udhampur' }
    ]
  },
  {
    code: 'JH', name: 'Jharkhand',
    districts: [
      { name: 'Bokaro' }, { name: 'Chatra' }, { name: 'Deoghar' },
      { name: 'Dhanbad' }, { name: 'Dumka' }, { name: 'East Singhbhum' },
      { name: 'Garhwa' }, { name: 'Giridih' }, { name: 'Godda' },
      { name: 'Gumla' }, { name: 'Hazaribagh' }, { name: 'Jamtara' },
      { name: 'Khunti' }, { name: 'Koderma' }, { name: 'Latehar' },
      { name: 'Lohardaga' }, { name: 'Pakur' }, { name: 'Palamu' },
      { name: 'Ramgarh' }, { name: 'Ranchi', famousFor: ['Lac Bangles', 'Tribal Art'] },
      { name: 'Sahebganj' }, { name: 'Seraikela Kharsawan' },
      { name: 'Simdega' }, { name: 'West Singhbhum' }
    ]
  },
  {
    code: 'KA', name: 'Karnataka',
    districts: [
      { name: 'Bagalkot' }, { name: 'Ballari' },
      { name: 'Belagavi' }, { name: 'Bengaluru Rural' }, { name: 'Bengaluru Urban' },
      { name: 'Bidar', famousFor: ['Bidriware'] }, { name: 'Chamarajanagar' },
      { name: 'Chikkaballapur' }, { name: 'Chikkamagaluru' }, { name: 'Chitradurga' },
      { name: 'Dakshina Kannada' }, { name: 'Davanagere' }, { name: 'Dharwad' },
      { name: 'Gadag' }, { name: 'Hassan' }, { name: 'Haveri' },
      { name: 'Kalaburagi' }, { name: 'Kodagu', famousFor: ['Coffee', 'Honey'] },
      { name: 'Kolar' }, { name: 'Koppal' }, { name: 'Mandya' },
      { name: 'Mysuru', famousFor: ['Mysore Silk', 'Sandalwood', 'Mysore Pak'] },
      { name: 'Raichur' }, { name: 'Ramanagara' }, { name: 'Shivamogga' },
      { name: 'Tumakuru' }, { name: 'Udupi' }, { name: 'Uttara Kannada' },
      { name: 'Vijayapura' }, { name: 'Yadgir' }
    ]
  },
  {
    code: 'KL', name: 'Kerala',
    districts: [
      { name: 'Alappuzha', famousFor: ['Coir Products', 'Houseboat'] },
      { name: 'Ernakulam' }, { name: 'Idukki', famousFor: ['Spices', 'Cardamom'] },
      { name: 'Kannur', famousFor: ['Handloom', 'Theyyam'] },
      { name: 'Kasaragod' }, { name: 'Kollam', famousFor: ['Cashew'] },
      { name: 'Kottayam' }, { name: 'Kozhikode', famousFor: ['Kozhikode Halwa'] },
      { name: 'Malappuram' }, { name: 'Palakkad' },
      { name: 'Pathanamthitta' }, { name: 'Thiruvananthapuram', famousFor: ['Brass Lamps'] },
      { name: 'Thrissur', famousFor: ['Gold Jewelry'] }, { name: 'Wayanad', famousFor: ['Coffee', 'Pepper'] }
    ]
  },
  {
    code: 'LA', name: 'Ladakh',
    districts: [
      { name: 'Kargil' },
      { name: 'Leh', famousFor: ['Pashmina', 'Apricot', 'Ladakhi Jewelry'] }
    ]
  },
  {
    code: 'LD', name: 'Lakshadweep',
    districts: [{ name: 'Lakshadweep', famousFor: ['Coir', 'Tuna Fish'] }]
  },
  {
    code: 'MP', name: 'Madhya Pradesh',
    districts: [
      { name: 'Agar Malwa' }, { name: 'Alirajpur' }, { name: 'Anuppur' },
      { name: 'Ashoknagar' }, { name: 'Balaghat' }, { name: 'Barwani' },
      { name: 'Betul' }, { name: 'Bhind' }, { name: 'Bhopal' },
      { name: 'Burhanpur' }, { name: 'Chhatarpur' },
      { name: 'Chhindwara' }, { name: 'Damoh' }, { name: 'Datia' },
      { name: 'Dewas' }, { name: 'Dhar', famousFor: ['Bagh Print'] },
      { name: 'Dindori' }, { name: 'Guna' },
      { name: 'Gwalior' }, { name: 'Harda' }, { name: 'Hoshangabad' },
      { name: 'Indore' }, { name: 'Jabalpur' }, { name: 'Jhabua' },
      { name: 'Katni' }, { name: 'Khandwa' }, { name: 'Khargone' },
      { name: 'Mandla', famousFor: ['Gond Art'] }, { name: 'Mandsaur' },
      { name: 'Morena' }, { name: 'Narsinghpur' }, { name: 'Neemuch' },
      { name: 'Panna' }, { name: 'Raisen' }, { name: 'Rajgarh' },
      { name: 'Ratlam' }, { name: 'Rewa' }, { name: 'Sagar' },
      { name: 'Satna' }, { name: 'Sehore' }, { name: 'Seoni' },
      { name: 'Shahdol' }, { name: 'Shajapur' }, { name: 'Sheopur' },
      { name: 'Shivpuri' }, { name: 'Sidhi' }, { name: 'Singrauli' },
      { name: 'Tikamgarh' }, { name: 'Ujjain' }, { name: 'Umaria' }, { name: 'Vidisha' },
      { name: 'Chanderi', famousFor: ['Chanderi Silk'] }
    ]
  },
  {
    code: 'MH', name: 'Maharashtra',
    districts: [
      { name: 'Ahmednagar' }, { name: 'Akola' }, { name: 'Amravati' },
      { name: 'Aurangabad', famousFor: ['Paithani Saree', 'Himroo Shawl'] },
      { name: 'Beed' }, { name: 'Bhandara' }, { name: 'Buldhana' },
      { name: 'Chandrapur', famousFor: ['Bamboo Craft'] },
      { name: 'Dhule' }, { name: 'Gadchiroli' }, { name: 'Gondia' },
      { name: 'Hingoli' }, { name: 'Jalgaon', famousFor: ['Banana'] },
      { name: 'Jalna' },
      { name: 'Kolhapur', famousFor: ['Kolhapuri Chappal', 'Kolhapuri Jewelry'] },
      { name: 'Latur' }, { name: 'Mumbai City' }, { name: 'Mumbai Suburban' },
      { name: 'Nagpur', famousFor: ['Nagpur Orange'] },
      { name: 'Nanded' }, { name: 'Nandurbar' }, { name: 'Nashik', famousFor: ['Grapes', 'Wine'] },
      { name: 'Osmanabad' }, { name: 'Palghar' }, { name: 'Parbhani' },
      { name: 'Pune' }, { name: 'Raigad' }, { name: 'Ratnagiri', famousFor: ['Alphonso Mango'] },
      { name: 'Sangli' }, { name: 'Satara' }, { name: 'Sindhudurg', famousFor: ['Cashew', 'Kokum'] },
      { name: 'Solapur', famousFor: ['Solapur Chaddar', 'Solapur Towel'] },
      { name: 'Thane' }, { name: 'Wardha' }, { name: 'Washim' }, { name: 'Yavatmal' }
    ]
  },
  {
    code: 'MN', name: 'Manipur',
    districts: [
      { name: 'Bishnupur' }, { name: 'Chandel' }, { name: 'Churachandpur' },
      { name: 'Imphal East', famousFor: ['Manipuri Shawl', 'Pottery'] },
      { name: 'Imphal West' }, { name: 'Jiribam' }, { name: 'Kakching' },
      { name: 'Kamjong' }, { name: 'Kangpokpi' }, { name: 'Noney' },
      { name: 'Pherzawl' }, { name: 'Senapati' }, { name: 'Tamenglong' },
      { name: 'Tengnoupal' }, { name: 'Thoubal' }, { name: 'Ukhrul' }
    ]
  }
];
