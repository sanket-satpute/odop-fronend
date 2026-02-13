/**
 * India States and Districts Data - Part 3
 * Remaining states from Meghalaya to Uttarakhand
 */

import { State } from './india-locations';

export const INDIA_STATES_PART3: State[] = [
  {
    code: 'ML', name: 'Meghalaya',
    districts: [
      { name: 'East Garo Hills' }, { name: 'East Jaintia Hills' },
      { name: 'East Khasi Hills', famousFor: ['Khasi Mandarin Orange'] },
      { name: 'North Garo Hills' }, { name: 'Ri Bhoi' },
      { name: 'South Garo Hills' }, { name: 'South West Garo Hills' },
      { name: 'South West Khasi Hills' }, { name: 'West Garo Hills' },
      { name: 'West Jaintia Hills' }, { name: 'West Khasi Hills' }
    ]
  },
  {
    code: 'MZ', name: 'Mizoram',
    districts: [
      { name: 'Aizawl', famousFor: ['Mizo Puan', 'Bamboo Craft'] },
      { name: 'Champhai' }, { name: 'Hnahthial' }, { name: 'Khawzawl' },
      { name: 'Kolasib' }, { name: 'Lawngtlai' }, { name: 'Lunglei' },
      { name: 'Mamit' }, { name: 'Saiha' }, { name: 'Saitual' }, { name: 'Serchhip' }
    ]
  },
  {
    code: 'NL', name: 'Nagaland',
    districts: [
      { name: 'Dimapur' }, { name: 'Kiphire' }, { name: 'Kohima', famousFor: ['Naga Shawl', 'Wood Carving'] },
      { name: 'Longleng' }, { name: 'Mokokchung' }, { name: 'Mon' },
      { name: 'Peren' }, { name: 'Phek' }, { name: 'Tuensang' },
      { name: 'Wokha' }, { name: 'Zunheboto' }
    ]
  },
  {
    code: 'OD', name: 'Odisha',
    districts: [
      { name: 'Angul' }, { name: 'Balangir' }, { name: 'Balasore' },
      { name: 'Bargarh' }, { name: 'Bhadrak' }, { name: 'Boudh' },
      { name: 'Cuttack', famousFor: ['Silver Filigree'] },
      { name: 'Deogarh' }, { name: 'Dhenkanal' }, { name: 'Gajapati' },
      { name: 'Ganjam' }, { name: 'Jagatsinghpur' }, { name: 'Jajpur' },
      { name: 'Jharsuguda' }, { name: 'Kalahandi' }, { name: 'Kandhamal' },
      { name: 'Kendrapara' }, { name: 'Kendujhar' }, { name: 'Khordha' },
      { name: 'Koraput', famousFor: ['Tribal Craft'] }, { name: 'Malkangiri' },
      { name: 'Mayurbhanj' }, { name: 'Nabarangpur' }, { name: 'Nayagarh' },
      { name: 'Nuapada' }, { name: 'Puri', famousFor: ['Pattachitra', 'Applique Work'] },
      { name: 'Rayagada' },
      { name: 'Sambalpur', famousFor: ['Sambalpuri Saree', 'Sambalpuri Ikat'] },
      { name: 'Subarnapur' }, { name: 'Sundargarh' }
    ]
  },
  {
    code: 'PY', name: 'Puducherry',
    districts: [
      { name: 'Karaikal' }, { name: 'Mahe' },
      { name: 'Puducherry', famousFor: ['Leather Goods', 'Pottery'] }, { name: 'Yanam' }
    ]
  },
  {
    code: 'PB', name: 'Punjab',
    districts: [
      { name: 'Amritsar', famousFor: ['Phulkari', 'Amritsari Papad'] },
      { name: 'Barnala' }, { name: 'Bathinda' }, { name: 'Faridkot' },
      { name: 'Fatehgarh Sahib' }, { name: 'Fazilka' }, { name: 'Ferozepur' },
      { name: 'Gurdaspur' }, { name: 'Hoshiarpur' },
      { name: 'Jalandhar', famousFor: ['Sports Goods', 'Leather'] },
      { name: 'Kapurthala' }, { name: 'Ludhiana', famousFor: ['Woolen Knitwear', 'Hosiery'] },
      { name: 'Mansa' }, { name: 'Moga' }, { name: 'Mohali' },
      { name: 'Muktsar' }, { name: 'Pathankot' },
      { name: 'Patiala', famousFor: ['Patiala Jutti', 'Patiala Shahi Pagg'] },
      { name: 'Rupnagar' }, { name: 'Sangrur' },
      { name: 'Shaheed Bhagat Singh Nagar' }, { name: 'Tarn Taran' }
    ]
  },
  {
    code: 'RJ', name: 'Rajasthan',
    districts: [
      { name: 'Ajmer' }, { name: 'Alwar' }, { name: 'Banswara' },
      { name: 'Baran' }, { name: 'Barmer', famousFor: ['Barmer Embroidery'] },
      { name: 'Bharatpur' }, { name: 'Bhilwara' }, { name: 'Bikaner', famousFor: ['Bikaner Bhujia'] },
      { name: 'Bundi' }, { name: 'Chittorgarh' }, { name: 'Churu' },
      { name: 'Dausa' }, { name: 'Dholpur' }, { name: 'Dungarpur' },
      { name: 'Hanumangarh' }, { name: 'Jaipur', famousFor: ['Blue Pottery', 'Block Print', 'Jewelry'] },
      { name: 'Jaisalmer' }, { name: 'Jalore' }, { name: 'Jhalawar' },
      { name: 'Jhunjhunu' }, { name: 'Jodhpur', famousFor: ['Jodhpuri Bandhani', 'Leather'] },
      { name: 'Karauli' }, { name: 'Kota', famousFor: ['Kota Doria Saree'] },
      { name: 'Nagaur', famousFor: ['Nagauri Marble'] },
      { name: 'Pali' }, { name: 'Pratapgarh' }, { name: 'Rajsamand', famousFor: ['Marble'] },
      { name: 'Sawai Madhopur' }, { name: 'Sikar' }, { name: 'Sirohi' },
      { name: 'Sri Ganganagar' }, { name: 'Tonk' }, { name: 'Udaipur', famousFor: ['Meenakari', 'Marble'] }
    ]
  },
  {
    code: 'SK', name: 'Sikkim',
    districts: [
      { name: 'East Sikkim', famousFor: ['Sikkim Tea', 'Cardamom'] },
      { name: 'North Sikkim' }, { name: 'South Sikkim' }, { name: 'West Sikkim' }
    ]
  },
  {
    code: 'TN', name: 'Tamil Nadu',
    districts: [
      { name: 'Ariyalur' }, { name: 'Chengalpattu' }, { name: 'Chennai' },
      { name: 'Coimbatore' }, { name: 'Cuddalore' }, { name: 'Dharmapuri' },
      { name: 'Dindigul' }, { name: 'Erode' },
      { name: 'Kallakurichi' }, { name: 'Kanchipuram', famousFor: ['Kanchipuram Silk Saree'] },
      { name: 'Kanyakumari' }, { name: 'Karur' }, { name: 'Krishnagiri' },
      { name: 'Madurai', famousFor: ['Madurai Sungudi Saree'] },
      { name: 'Mayiladuthurai' }, { name: 'Nagapattinam' }, { name: 'Namakkal' },
      { name: 'Nilgiris', famousFor: ['Nilgiri Tea'] },
      { name: 'Perambalur' }, { name: 'Pudukkottai' }, { name: 'Ramanathapuram' },
      { name: 'Ranipet' }, { name: 'Salem', famousFor: ['Salem Steel'] },
      { name: 'Sivaganga' },
      { name: 'Tenkasi' }, { name: 'Thanjavur', famousFor: ['Thanjavur Painting', 'Thanjavur Doll'] },
      { name: 'Theni' }, { name: 'Thoothukudi' },
      { name: 'Tiruchirappalli' }, { name: 'Tirunelveli' },
      { name: 'Tirupathur' }, { name: 'Tiruppur', famousFor: ['Cotton Knitwear'] },
      { name: 'Tiruvallur' }, { name: 'Tiruvannamalai' }, { name: 'Tiruvarur' },
      { name: 'Vellore' }, { name: 'Viluppuram' }, { name: 'Virudhunagar' }
    ]
  },
  {
    code: 'TG', name: 'Telangana',
    districts: [
      { name: 'Adilabad' }, { name: 'Bhadradri Kothagudem' },
      { name: 'Hyderabad', famousFor: ['Hyderabadi Pearls', 'Bidriware'] },
      { name: 'Jagtial' }, { name: 'Jangaon' }, { name: 'Jayashankar Bhupalpally' },
      { name: 'Jogulamba Gadwal', famousFor: ['Gadwal Saree'] },
      { name: 'Kamareddy' }, { name: 'Karimnagar' }, { name: 'Khammam' },
      { name: 'Komaram Bheem' }, { name: 'Mahabubabad' }, { name: 'Mahabubnagar' },
      { name: 'Mancherial' }, { name: 'Medak' }, { name: 'Medchal–Malkajgiri' },
      { name: 'Mulugu' }, { name: 'Nagarkurnool' },
      { name: 'Nalgonda', famousFor: ['Pochampally Ikat'] },
      { name: 'Narayanpet' }, { name: 'Nirmal', famousFor: ['Nirmal Painting', 'Nirmal Toys'] },
      { name: 'Nizamabad' }, { name: 'Peddapalli' }, { name: 'Rajanna Sircilla' },
      { name: 'Rangareddy' }, { name: 'Sangareddy' }, { name: 'Siddipet' },
      { name: 'Suryapet' }, { name: 'Vikarabad' }, { name: 'Wanaparthy' },
      { name: 'Warangal Rural', famousFor: ['Warangal Durries'] },
      { name: 'Warangal Urban' }, { name: 'Yadadri Bhuvanagiri' }
    ]
  },
  {
    code: 'TR', name: 'Tripura',
    districts: [
      { name: 'Dhalai' }, { name: 'Gomati' }, { name: 'Khowai' },
      { name: 'North Tripura' }, { name: 'Sepahijala' },
      { name: 'South Tripura' }, { name: 'Unakoti' },
      { name: 'West Tripura', famousFor: ['Bamboo Craft', 'Cane Furniture'] }
    ]
  },
  {
    code: 'UP', name: 'Uttar Pradesh',
    districts: [
      { name: 'Agra', famousFor: ['Marble Inlay', 'Petha'] },
      { name: 'Aligarh', famousFor: ['Aligarh Lock'] }, { name: 'Ambedkar Nagar' },
      { name: 'Amethi' }, { name: 'Amroha' }, { name: 'Auraiya' },
      { name: 'Ayodhya' }, { name: 'Azamgarh', famousFor: ['Black Pottery'] },
      { name: 'Baghpat' }, { name: 'Bahraich' }, { name: 'Ballia' },
      { name: 'Balrampur' }, { name: 'Banda' }, { name: 'Barabanki' },
      { name: 'Bareilly', famousFor: ['Zari-Zardozi'] }, { name: 'Basti' },
      { name: 'Bhadohi', famousFor: ['Bhadohi Carpets'] },
      { name: 'Bijnor' }, { name: 'Budaun' }, { name: 'Bulandshahr' },
      { name: 'Chandauli' }, { name: 'Chitrakoot' }, { name: 'Deoria' },
      { name: 'Etah' }, { name: 'Etawah' }, { name: 'Farrukhabad' },
      { name: 'Fatehpur' }, { name: 'Firozabad', famousFor: ['Glass Bangles'] },
      { name: 'Gautam Buddha Nagar' },
      { name: 'Ghaziabad' }, { name: 'Ghazipur' }, { name: 'Gonda' },
      { name: 'Gorakhpur', famousFor: ['Gorakhpur Terracotta'] },
      { name: 'Hamirpur' }, { name: 'Hapur' }, { name: 'Hardoi' },
      { name: 'Hathras' }, { name: 'Jalaun' }, { name: 'Jaunpur' },
      { name: 'Jhansi' }, { name: 'Kannauj', famousFor: ['Kannauj Perfume/Attar'] },
      { name: 'Kanpur Dehat' }, { name: 'Kanpur Nagar', famousFor: ['Leather Goods'] },
      { name: 'Kasganj' }, { name: 'Kaushambi' }, { name: 'Kheri' },
      { name: 'Kushinagar' }, { name: 'Lalitpur' },
      { name: 'Lucknow', famousFor: ['Chikankari', 'Lucknowi Kurta'] },
      { name: 'Maharajganj' }, { name: 'Mahoba' }, { name: 'Mainpuri' },
      { name: 'Mathura', famousFor: ['Mathura Peda'] }, { name: 'Mau' },
      { name: 'Meerut', famousFor: ['Sports Goods', 'Scissors'] },
      { name: 'Mirzapur', famousFor: ['Mirzapur Carpets'] },
      { name: 'Moradabad', famousFor: ['Moradabad Brass'] },
      { name: 'Muzaffarnagar' }, { name: 'Pilibhit' }, { name: 'Pratapgarh' },
      { name: 'Prayagraj' }, { name: 'Raebareli' }, { name: 'Rampur' },
      { name: 'Saharanpur', famousFor: ['Wood Carving'] },
      { name: 'Sambhal' }, { name: 'Sant Kabir Nagar' }, { name: 'Shahjahanpur' },
      { name: 'Shamli' }, { name: 'Shravasti' }, { name: 'Siddharthnagar' },
      { name: 'Sitapur' }, { name: 'Sonbhadra' }, { name: 'Sultanpur' },
      { name: 'Unnao' },
      { name: 'Varanasi', famousFor: ['Banarasi Silk Saree', 'Banarasi Brocade'] }
    ]
  },
  {
    code: 'UK', name: 'Uttarakhand',
    districts: [
      { name: 'Almora', famousFor: ['Aipan Art'] },
      { name: 'Bageshwar' }, { name: 'Chamoli' },
      { name: 'Champawat' }, { name: 'Dehradun' }, { name: 'Haridwar' },
      { name: 'Nainital' }, { name: 'Pauri Garhwal' }, { name: 'Pithoragarh' },
      { name: 'Rudraprayag' }, { name: 'Tehri Garhwal' },
      { name: 'Udham Singh Nagar' }, { name: 'Uttarkashi' }
    ]
  }
];
