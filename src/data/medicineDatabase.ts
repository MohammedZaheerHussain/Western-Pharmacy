/**
 * Medicine Database - Pre-loaded common Indian pharmacy medicines
 * Used for auto-complete when adding new medicines
 * This helps speed up medicine entry by suggesting from known medicines
 */

export interface MedicineTemplate {
    name: string;
    brand: string;
    salt: string;
    category: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Cream' | 'Drops' | 'Powder' | 'Other';
    suggestedPrice?: number; // MRP suggestion
    tabletsPerStrip?: number;
}

/**
 * Common Indian pharmacy medicines database
 * Data includes popular OTC and prescription medicines
 */
export const MEDICINE_DATABASE: MedicineTemplate[] = [
    // ============ PAIN & FEVER ============
    { name: 'Paracetamol 500mg', brand: 'Crocin', salt: 'Paracetamol', category: 'Tablet', suggestedPrice: 30, tabletsPerStrip: 10 },
    { name: 'Paracetamol 650mg', brand: 'Dolo', salt: 'Paracetamol', category: 'Tablet', suggestedPrice: 35, tabletsPerStrip: 15 },
    { name: 'Paracetamol 500mg', brand: 'Calpol', salt: 'Paracetamol', category: 'Tablet', suggestedPrice: 28, tabletsPerStrip: 10 },
    { name: 'Ibuprofen 400mg', brand: 'Brufen', salt: 'Ibuprofen', category: 'Tablet', suggestedPrice: 45, tabletsPerStrip: 10 },
    { name: 'Ibuprofen 200mg', brand: 'Brufen', salt: 'Ibuprofen', category: 'Tablet', suggestedPrice: 30, tabletsPerStrip: 10 },
    { name: 'Diclofenac 50mg', brand: 'Voveran', salt: 'Diclofenac Sodium', category: 'Tablet', suggestedPrice: 40, tabletsPerStrip: 10 },
    { name: 'Diclofenac Gel', brand: 'Voveran Emulgel', salt: 'Diclofenac Diethylamine', category: 'Cream', suggestedPrice: 120 },
    { name: 'Aceclofenac 100mg', brand: 'Zerodol', salt: 'Aceclofenac', category: 'Tablet', suggestedPrice: 85, tabletsPerStrip: 10 },
    { name: 'Aceclofenac + Paracetamol', brand: 'Zerodol-P', salt: 'Aceclofenac + Paracetamol', category: 'Tablet', suggestedPrice: 95, tabletsPerStrip: 10 },
    { name: 'Nimesulide 100mg', brand: 'Nimulid', salt: 'Nimesulide', category: 'Tablet', suggestedPrice: 60, tabletsPerStrip: 10 },
    { name: 'Aspirin 75mg', brand: 'Ecosprin', salt: 'Aspirin', category: 'Tablet', suggestedPrice: 25, tabletsPerStrip: 14 },
    { name: 'Aspirin 150mg', brand: 'Ecosprin', salt: 'Aspirin', category: 'Tablet', suggestedPrice: 35, tabletsPerStrip: 14 },
    { name: 'Mefenamic Acid 500mg', brand: 'Meftal', salt: 'Mefenamic Acid', category: 'Tablet', suggestedPrice: 55, tabletsPerStrip: 10 },
    { name: 'Mefenamic + Paracetamol', brand: 'Meftal-Spas', salt: 'Mefenamic Acid + Dicyclomine', category: 'Tablet', suggestedPrice: 70, tabletsPerStrip: 10 },
    { name: 'Tramadol 50mg', brand: 'Ultracet', salt: 'Tramadol + Paracetamol', category: 'Tablet', suggestedPrice: 120, tabletsPerStrip: 10 },

    // ============ ANTIBIOTICS ============
    { name: 'Amoxicillin 250mg', brand: 'Mox', salt: 'Amoxicillin', category: 'Capsule', suggestedPrice: 85, tabletsPerStrip: 10 },
    { name: 'Amoxicillin 500mg', brand: 'Mox', salt: 'Amoxicillin', category: 'Capsule', suggestedPrice: 120, tabletsPerStrip: 10 },
    { name: 'Amoxicillin + Clavulanic Acid 625mg', brand: 'Augmentin', salt: 'Amoxicillin + Clavulanate', category: 'Tablet', suggestedPrice: 280, tabletsPerStrip: 6 },
    { name: 'Azithromycin 250mg', brand: 'Azee', salt: 'Azithromycin', category: 'Tablet', suggestedPrice: 95, tabletsPerStrip: 6 },
    { name: 'Azithromycin 500mg', brand: 'Azee', salt: 'Azithromycin', category: 'Tablet', suggestedPrice: 120, tabletsPerStrip: 3 },
    { name: 'Ciprofloxacin 500mg', brand: 'Ciplox', salt: 'Ciprofloxacin', category: 'Tablet', suggestedPrice: 75, tabletsPerStrip: 10 },
    { name: 'Ofloxacin 200mg', brand: 'Oflox', salt: 'Ofloxacin', category: 'Tablet', suggestedPrice: 90, tabletsPerStrip: 10 },
    { name: 'Ofloxacin + Ornidazole', brand: 'O2', salt: 'Ofloxacin + Ornidazole', category: 'Tablet', suggestedPrice: 145, tabletsPerStrip: 10 },
    { name: 'Levofloxacin 500mg', brand: 'Levomac', salt: 'Levofloxacin', category: 'Tablet', suggestedPrice: 140, tabletsPerStrip: 5 },
    { name: 'Cefixime 200mg', brand: 'Taxim-O', salt: 'Cefixime', category: 'Tablet', suggestedPrice: 180, tabletsPerStrip: 10 },
    { name: 'Cefpodoxime 200mg', brand: 'Cepodem', salt: 'Cefpodoxime', category: 'Tablet', suggestedPrice: 220, tabletsPerStrip: 10 },
    { name: 'Metronidazole 400mg', brand: 'Flagyl', salt: 'Metronidazole', category: 'Tablet', suggestedPrice: 35, tabletsPerStrip: 10 },
    { name: 'Doxycycline 100mg', brand: 'Doxt', salt: 'Doxycycline', category: 'Capsule', suggestedPrice: 80, tabletsPerStrip: 10 },
    { name: 'Clindamycin 300mg', brand: 'Dalacin C', salt: 'Clindamycin', category: 'Capsule', suggestedPrice: 180, tabletsPerStrip: 8 },

    // ============ ANTACIDS & GI ============
    { name: 'Omeprazole 20mg', brand: 'Omez', salt: 'Omeprazole', category: 'Capsule', suggestedPrice: 65, tabletsPerStrip: 10 },
    { name: 'Pantoprazole 40mg', brand: 'Pan', salt: 'Pantoprazole', category: 'Tablet', suggestedPrice: 85, tabletsPerStrip: 10 },
    { name: 'Rabeprazole 20mg', brand: 'Razo', salt: 'Rabeprazole', category: 'Tablet', suggestedPrice: 95, tabletsPerStrip: 10 },
    { name: 'Esomeprazole 40mg', brand: 'Neksium', salt: 'Esomeprazole', category: 'Tablet', suggestedPrice: 140, tabletsPerStrip: 10 },
    { name: 'Pantoprazole + Domperidone', brand: 'Pan-D', salt: 'Pantoprazole + Domperidone', category: 'Capsule', suggestedPrice: 120, tabletsPerStrip: 10 },
    { name: 'Ranitidine 150mg', brand: 'Rantac', salt: 'Ranitidine', category: 'Tablet', suggestedPrice: 35, tabletsPerStrip: 10 },
    { name: 'Famotidine 20mg', brand: 'Famocid', salt: 'Famotidine', category: 'Tablet', suggestedPrice: 45, tabletsPerStrip: 10 },
    { name: 'Domperidone 10mg', brand: 'Domstal', salt: 'Domperidone', category: 'Tablet', suggestedPrice: 50, tabletsPerStrip: 10 },
    { name: 'Ondansetron 4mg', brand: 'Emeset', salt: 'Ondansetron', category: 'Tablet', suggestedPrice: 65, tabletsPerStrip: 10 },
    { name: 'Sucralfate 1g', brand: 'Sucrafil', salt: 'Sucralfate', category: 'Tablet', suggestedPrice: 120, tabletsPerStrip: 10 },
    { name: 'Antacid Gel', brand: 'Digene', salt: 'Aluminium Hydroxide + Magnesium', category: 'Syrup', suggestedPrice: 95 },
    { name: 'ENO Fruit Salt', brand: 'ENO', salt: 'Sodium Bicarbonate', category: 'Powder', suggestedPrice: 45 },
    { name: 'Gelusil MPS', brand: 'Gelusil', salt: 'Aluminium + Magnesium + Simethicone', category: 'Tablet', suggestedPrice: 55, tabletsPerStrip: 10 },
    { name: 'Loperamide 2mg', brand: 'Eldoper', salt: 'Loperamide', category: 'Capsule', suggestedPrice: 40, tabletsPerStrip: 4 },
    { name: 'ORS Powder', brand: 'Electral', salt: 'Oral Rehydration Salts', category: 'Powder', suggestedPrice: 20 },

    // ============ ALLERGY & COLD ============
    { name: 'Cetirizine 10mg', brand: 'Zyrtec', salt: 'Cetirizine', category: 'Tablet', suggestedPrice: 45, tabletsPerStrip: 10 },
    { name: 'Levocetirizine 5mg', brand: 'Xyzal', salt: 'Levocetirizine', category: 'Tablet', suggestedPrice: 65, tabletsPerStrip: 10 },
    { name: 'Fexofenadine 120mg', brand: 'Allegra', salt: 'Fexofenadine', category: 'Tablet', suggestedPrice: 135, tabletsPerStrip: 10 },
    { name: 'Fexofenadine 180mg', brand: 'Allegra', salt: 'Fexofenadine', category: 'Tablet', suggestedPrice: 180, tabletsPerStrip: 10 },
    { name: 'Loratadine 10mg', brand: 'Claritin', salt: 'Loratadine', category: 'Tablet', suggestedPrice: 60, tabletsPerStrip: 10 },
    { name: 'Montelukast 10mg', brand: 'Montair', salt: 'Montelukast', category: 'Tablet', suggestedPrice: 175, tabletsPerStrip: 10 },
    { name: 'Montelukast + Levocetirizine', brand: 'Montair-LC', salt: 'Montelukast + Levocetirizine', category: 'Tablet', suggestedPrice: 195, tabletsPerStrip: 10 },
    { name: 'Chlorpheniramine 4mg', brand: 'Avil', salt: 'Chlorpheniramine', category: 'Tablet', suggestedPrice: 25, tabletsPerStrip: 10 },
    { name: 'Phenylephrine + Paracetamol', brand: 'Sinarest', salt: 'Phenylephrine + Paracetamol', category: 'Tablet', suggestedPrice: 45, tabletsPerStrip: 10 },
    { name: 'Cough Syrup', brand: 'Benadryl', salt: 'Diphenhydramine', category: 'Syrup', suggestedPrice: 85 },
    { name: 'Cough Syrup', brand: 'Grilinctus', salt: 'Dextromethorphan + Guaifenesin', category: 'Syrup', suggestedPrice: 95 },
    { name: 'Cough Syrup', brand: 'Ascoril-D', salt: 'Salbutamol + Bromhexine', category: 'Syrup', suggestedPrice: 120 },
    { name: 'Nasal Drops', brand: 'Otrivin', salt: 'Xylometazoline', category: 'Drops', suggestedPrice: 75 },
    { name: 'Steam Inhaler Capsule', brand: 'Karvol Plus', salt: 'Menthol + Eucalyptus', category: 'Capsule', suggestedPrice: 55, tabletsPerStrip: 10 },

    // ============ DIABETES ============
    { name: 'Metformin 500mg', brand: 'Glycomet', salt: 'Metformin', category: 'Tablet', suggestedPrice: 35, tabletsPerStrip: 10 },
    { name: 'Metformin 850mg', brand: 'Glycomet', salt: 'Metformin', category: 'Tablet', suggestedPrice: 55, tabletsPerStrip: 10 },
    { name: 'Metformin 1000mg', brand: 'Glycomet', salt: 'Metformin', category: 'Tablet', suggestedPrice: 75, tabletsPerStrip: 10 },
    { name: 'Glimepiride 1mg', brand: 'Amaryl', salt: 'Glimepiride', category: 'Tablet', suggestedPrice: 70, tabletsPerStrip: 10 },
    { name: 'Glimepiride 2mg', brand: 'Amaryl', salt: 'Glimepiride', category: 'Tablet', suggestedPrice: 95, tabletsPerStrip: 10 },
    { name: 'Glimepiride + Metformin', brand: 'Amaryl-M', salt: 'Glimepiride + Metformin', category: 'Tablet', suggestedPrice: 130, tabletsPerStrip: 10 },
    { name: 'Gliclazide 40mg', brand: 'Diamicron', salt: 'Gliclazide', category: 'Tablet', suggestedPrice: 85, tabletsPerStrip: 10 },
    { name: 'Sitagliptin 100mg', brand: 'Januvia', salt: 'Sitagliptin', category: 'Tablet', suggestedPrice: 550, tabletsPerStrip: 7 },
    { name: 'Vildagliptin 50mg', brand: 'Galvus', salt: 'Vildagliptin', category: 'Tablet', suggestedPrice: 420, tabletsPerStrip: 10 },
    { name: 'Pioglitazone 15mg', brand: 'Pioz', salt: 'Pioglitazone', category: 'Tablet', suggestedPrice: 95, tabletsPerStrip: 10 },

    // ============ HYPERTENSION ============
    { name: 'Amlodipine 5mg', brand: 'Amlong', salt: 'Amlodipine', category: 'Tablet', suggestedPrice: 45, tabletsPerStrip: 10 },
    { name: 'Amlodipine 10mg', brand: 'Amlong', salt: 'Amlodipine', category: 'Tablet', suggestedPrice: 65, tabletsPerStrip: 10 },
    { name: 'Telmisartan 40mg', brand: 'Telma', salt: 'Telmisartan', category: 'Tablet', suggestedPrice: 115, tabletsPerStrip: 10 },
    { name: 'Telmisartan 80mg', brand: 'Telma', salt: 'Telmisartan', category: 'Tablet', suggestedPrice: 165, tabletsPerStrip: 10 },
    { name: 'Telmisartan + Amlodipine', brand: 'Telma-AM', salt: 'Telmisartan + Amlodipine', category: 'Tablet', suggestedPrice: 195, tabletsPerStrip: 10 },
    { name: 'Losartan 50mg', brand: 'Losar', salt: 'Losartan', category: 'Tablet', suggestedPrice: 85, tabletsPerStrip: 10 },
    { name: 'Olmesartan 20mg', brand: 'Olmetec', salt: 'Olmesartan', category: 'Tablet', suggestedPrice: 145, tabletsPerStrip: 10 },
    { name: 'Atenolol 50mg', brand: 'Aten', salt: 'Atenolol', category: 'Tablet', suggestedPrice: 35, tabletsPerStrip: 14 },
    { name: 'Metoprolol 50mg', brand: 'Betaloc', salt: 'Metoprolol', category: 'Tablet', suggestedPrice: 55, tabletsPerStrip: 10 },
    { name: 'Nebivolol 5mg', brand: 'Nebicard', salt: 'Nebivolol', category: 'Tablet', suggestedPrice: 120, tabletsPerStrip: 10 },
    { name: 'Ramipril 5mg', brand: 'Cardace', salt: 'Ramipril', category: 'Tablet', suggestedPrice: 85, tabletsPerStrip: 10 },
    { name: 'Enalapril 5mg', brand: 'Envas', salt: 'Enalapril', category: 'Tablet', suggestedPrice: 45, tabletsPerStrip: 10 },
    { name: 'Hydrochlorothiazide 12.5mg', brand: 'Aquazide', salt: 'Hydrochlorothiazide', category: 'Tablet', suggestedPrice: 25, tabletsPerStrip: 10 },
    { name: 'Furosemide 40mg', brand: 'Lasix', salt: 'Furosemide', category: 'Tablet', suggestedPrice: 30, tabletsPerStrip: 10 },
    { name: 'Spironolactone 25mg', brand: 'Aldactone', salt: 'Spironolactone', category: 'Tablet', suggestedPrice: 55, tabletsPerStrip: 10 },

    // ============ VITAMINS & SUPPLEMENTS ============
    { name: 'Vitamin B Complex', brand: 'Becosules', salt: 'B-Complex + Vitamin C', category: 'Capsule', suggestedPrice: 45, tabletsPerStrip: 20 },
    { name: 'Vitamin C 500mg', brand: 'Limcee', salt: 'Ascorbic Acid', category: 'Tablet', suggestedPrice: 35, tabletsPerStrip: 15 },
    { name: 'Vitamin D3 60000 IU', brand: 'Uprise D3', salt: 'Cholecalciferol', category: 'Capsule', suggestedPrice: 120, tabletsPerStrip: 4 },
    { name: 'Vitamin E 400mg', brand: 'Evion', salt: 'Tocopherol', category: 'Capsule', suggestedPrice: 95, tabletsPerStrip: 10 },
    { name: 'Calcium + Vitamin D3', brand: 'Shelcal', salt: 'Calcium + Cholecalciferol', category: 'Tablet', suggestedPrice: 180, tabletsPerStrip: 15 },
    { name: 'Iron + Folic Acid', brand: 'Autrin', salt: 'Ferrous Fumarate + Folic Acid', category: 'Capsule', suggestedPrice: 85, tabletsPerStrip: 10 },
    { name: 'Folic Acid 5mg', brand: 'Folvite', salt: 'Folic Acid', category: 'Tablet', suggestedPrice: 25, tabletsPerStrip: 20 },
    { name: 'Zinc 50mg', brand: 'Zinconia', salt: 'Zinc Sulphate', category: 'Tablet', suggestedPrice: 65, tabletsPerStrip: 10 },
    { name: 'Multivitamin', brand: 'Supradyn', salt: 'Multivitamin + Minerals', category: 'Tablet', suggestedPrice: 120, tabletsPerStrip: 15 },
    { name: 'Omega 3 Fish Oil', brand: 'Seven Seas', salt: 'Omega 3 Fatty Acids', category: 'Capsule', suggestedPrice: 350, tabletsPerStrip: 30 },
    { name: 'Biotin 10mg', brand: 'Biotino', salt: 'Biotin', category: 'Tablet', suggestedPrice: 180, tabletsPerStrip: 10 },
    { name: 'Protein Powder', brand: 'Protinex', salt: 'Protein + Vitamins', category: 'Powder', suggestedPrice: 450 },

    // ============ SKIN & DERMATOLOGY ============
    { name: 'Clotrimazole Cream', brand: 'Candid', salt: 'Clotrimazole', category: 'Cream', suggestedPrice: 85 },
    { name: 'Ketoconazole Cream', brand: 'Nizral', salt: 'Ketoconazole', category: 'Cream', suggestedPrice: 95 },
    { name: 'Terbinafine Cream', brand: 'Lamisil', salt: 'Terbinafine', category: 'Cream', suggestedPrice: 120 },
    { name: 'Betamethasone Cream', brand: 'Betnovate', salt: 'Betamethasone', category: 'Cream', suggestedPrice: 75 },
    { name: 'Clobetasol Cream', brand: 'Tenovate', salt: 'Clobetasol', category: 'Cream', suggestedPrice: 95 },
    { name: 'Hydrocortisone Cream', brand: 'Cortisone', salt: 'Hydrocortisone', category: 'Cream', suggestedPrice: 55 },
    { name: 'Mupirocin Ointment', brand: 'T-Bact', salt: 'Mupirocin', category: 'Cream', suggestedPrice: 165 },
    { name: 'Fusidic Acid Cream', brand: 'Fucidin', salt: 'Fusidic Acid', category: 'Cream', suggestedPrice: 185 },
    { name: 'Silver Sulfadiazine Cream', brand: 'Silverex', salt: 'Silver Sulfadiazine', category: 'Cream', suggestedPrice: 145 },
    { name: 'Povidone Iodine Ointment', brand: 'Betadine', salt: 'Povidone Iodine', category: 'Cream', suggestedPrice: 85 },
    { name: 'Calamine Lotion', brand: 'Lacto Calamine', salt: 'Calamine', category: 'Other', suggestedPrice: 125 },
    { name: 'Permethrin Cream', brand: 'Scabper', salt: 'Permethrin', category: 'Cream', suggestedPrice: 95 },

    // ============ EYE & EAR ============
    { name: 'Ciprofloxacin Eye Drops', brand: 'Ciplox Eye', salt: 'Ciprofloxacin', category: 'Drops', suggestedPrice: 55 },
    { name: 'Ofloxacin Eye Drops', brand: 'Oflox Eye', salt: 'Ofloxacin', category: 'Drops', suggestedPrice: 65 },
    { name: 'Moxifloxacin Eye Drops', brand: 'Moxicip', salt: 'Moxifloxacin', category: 'Drops', suggestedPrice: 95 },
    { name: 'Tobramycin Eye Drops', brand: 'Tobrex', salt: 'Tobramycin', category: 'Drops', suggestedPrice: 120 },
    { name: 'Lubricating Eye Drops', brand: 'Refresh Tears', salt: 'Carboxymethylcellulose', category: 'Drops', suggestedPrice: 145 },
    { name: 'Lubricating Eye Drops', brand: 'Systane', salt: 'Polyethylene Glycol', category: 'Drops', suggestedPrice: 350 },
    { name: 'Ear Drops', brand: 'Soliwax', salt: 'Benzocaine + Chlorobutanol', category: 'Drops', suggestedPrice: 85 },
    { name: 'Ear Drops', brand: 'Waxomet', salt: 'Paradichlorobenzene', category: 'Drops', suggestedPrice: 75 },
    { name: 'Antibiotic Ear Drops', brand: 'Ciprodex', salt: 'Ciprofloxacin + Dexamethasone', category: 'Drops', suggestedPrice: 145 },

    // ============ RESPIRATORY ============
    { name: 'Salbutamol Inhaler', brand: 'Asthalin', salt: 'Salbutamol', category: 'Other', suggestedPrice: 135 },
    { name: 'Budesonide Inhaler', brand: 'Budecort', salt: 'Budesonide', category: 'Other', suggestedPrice: 280 },
    { name: 'Formoterol + Budesonide Inhaler', brand: 'Foracort', salt: 'Formoterol + Budesonide', category: 'Other', suggestedPrice: 450 },
    { name: 'Ipratropium Inhaler', brand: 'Ipravent', salt: 'Ipratropium', category: 'Other', suggestedPrice: 165 },
    { name: 'Deriphylline 150mg', brand: 'Deriphyllin', salt: 'Theophylline + Etofylline', category: 'Tablet', suggestedPrice: 45, tabletsPerStrip: 10 },
    { name: 'Theophylline 200mg', brand: 'Theodrip', salt: 'Theophylline', category: 'Tablet', suggestedPrice: 55, tabletsPerStrip: 10 },

    // ============ PSYCHIATRIC & NEURO ============
    { name: 'Alprazolam 0.25mg', brand: 'Alprax', salt: 'Alprazolam', category: 'Tablet', suggestedPrice: 45, tabletsPerStrip: 10 },
    { name: 'Alprazolam 0.5mg', brand: 'Alprax', salt: 'Alprazolam', category: 'Tablet', suggestedPrice: 55, tabletsPerStrip: 10 },
    { name: 'Clonazepam 0.5mg', brand: 'Clonil', salt: 'Clonazepam', category: 'Tablet', suggestedPrice: 35, tabletsPerStrip: 10 },
    { name: 'Escitalopram 10mg', brand: 'Nexito', salt: 'Escitalopram', category: 'Tablet', suggestedPrice: 115, tabletsPerStrip: 10 },
    { name: 'Sertraline 50mg', brand: 'Daxid', salt: 'Sertraline', category: 'Tablet', suggestedPrice: 95, tabletsPerStrip: 10 },
    { name: 'Fluoxetine 20mg', brand: 'Fludac', salt: 'Fluoxetine', category: 'Capsule', suggestedPrice: 85, tabletsPerStrip: 10 },
    { name: 'Amitriptyline 25mg', brand: 'Tryptomer', salt: 'Amitriptyline', category: 'Tablet', suggestedPrice: 35, tabletsPerStrip: 10 },
    { name: 'Gabapentin 300mg', brand: 'Gabapin', salt: 'Gabapentin', category: 'Capsule', suggestedPrice: 135, tabletsPerStrip: 10 },
    { name: 'Pregabalin 75mg', brand: 'Lyrica', salt: 'Pregabalin', category: 'Capsule', suggestedPrice: 185, tabletsPerStrip: 10 },
    { name: 'Zolpidem 10mg', brand: 'Zolfresh', salt: 'Zolpidem', category: 'Tablet', suggestedPrice: 145, tabletsPerStrip: 10 },

    // ============ THYROID ============
    { name: 'Levothyroxine 25mcg', brand: 'Thyronorm', salt: 'Levothyroxine', category: 'Tablet', suggestedPrice: 95, tabletsPerStrip: 30 },
    { name: 'Levothyroxine 50mcg', brand: 'Thyronorm', salt: 'Levothyroxine', category: 'Tablet', suggestedPrice: 110, tabletsPerStrip: 30 },
    { name: 'Levothyroxine 75mcg', brand: 'Thyronorm', salt: 'Levothyroxine', category: 'Tablet', suggestedPrice: 125, tabletsPerStrip: 30 },
    { name: 'Levothyroxine 100mcg', brand: 'Thyronorm', salt: 'Levothyroxine', category: 'Tablet', suggestedPrice: 135, tabletsPerStrip: 30 },
    { name: 'Carbimazole 5mg', brand: 'Neo-Mercazole', salt: 'Carbimazole', category: 'Tablet', suggestedPrice: 75, tabletsPerStrip: 30 },

    // ============ HORMONES & STEROIDS ============
    { name: 'Prednisolone 5mg', brand: 'Wysolone', salt: 'Prednisolone', category: 'Tablet', suggestedPrice: 25, tabletsPerStrip: 10 },
    { name: 'Prednisolone 10mg', brand: 'Wysolone', salt: 'Prednisolone', category: 'Tablet', suggestedPrice: 35, tabletsPerStrip: 10 },
    { name: 'Dexamethasone 0.5mg', brand: 'Dexona', salt: 'Dexamethasone', category: 'Tablet', suggestedPrice: 20, tabletsPerStrip: 20 },
    { name: 'Methylprednisolone 4mg', brand: 'Medrol', salt: 'Methylprednisolone', category: 'Tablet', suggestedPrice: 85, tabletsPerStrip: 10 },
    { name: 'Deflazacort 6mg', brand: 'Defcort', salt: 'Deflazacort', category: 'Tablet', suggestedPrice: 145, tabletsPerStrip: 6 },

    // ============ MUSCLE RELAXANTS ============
    { name: 'Chlorzoxazone 250mg', brand: 'Flexon', salt: 'Chlorzoxazone', category: 'Tablet', suggestedPrice: 75, tabletsPerStrip: 10 },
    { name: 'Thiocolchicoside 4mg', brand: 'Myoril', salt: 'Thiocolchicoside', category: 'Capsule', suggestedPrice: 95, tabletsPerStrip: 10 },
    { name: 'Eperisone 50mg', brand: 'Epigen', salt: 'Eperisone', category: 'Tablet', suggestedPrice: 120, tabletsPerStrip: 10 },
    { name: 'Tizanidine 2mg', brand: 'Tizan', salt: 'Tizanidine', category: 'Tablet', suggestedPrice: 65, tabletsPerStrip: 10 },
    { name: 'Cyclobenzaprine 5mg', brand: 'Flexmol', salt: 'Cyclobenzaprine', category: 'Tablet', suggestedPrice: 85, tabletsPerStrip: 10 },

    // ============ ANTISPASMODICS ============
    { name: 'Dicyclomine 10mg', brand: 'Cyclopam', salt: 'Dicyclomine', category: 'Tablet', suggestedPrice: 40, tabletsPerStrip: 10 },
    { name: 'Hyoscine 10mg', brand: 'Buscopan', salt: 'Hyoscine Butylbromide', category: 'Tablet', suggestedPrice: 55, tabletsPerStrip: 10 },
    { name: 'Drotaverine 40mg', brand: 'Drotin', salt: 'Drotaverine', category: 'Tablet', suggestedPrice: 65, tabletsPerStrip: 10 },
    { name: 'Drotaverine 80mg', brand: 'Drotin-DS', salt: 'Drotaverine', category: 'Tablet', suggestedPrice: 95, tabletsPerStrip: 10 },

    // ============ CONTRACEPTIVES ============
    { name: 'Levonorgestrel + Ethinyl Estradiol', brand: 'Mala-D', salt: 'Levonorgestrel + Ethinyl Estradiol', category: 'Tablet', suggestedPrice: 35, tabletsPerStrip: 28 },
    { name: 'Norethisterone 5mg', brand: 'Primolut-N', salt: 'Norethisterone', category: 'Tablet', suggestedPrice: 95, tabletsPerStrip: 10 },
    { name: 'Levonorgestrel 1.5mg', brand: 'I-Pill', salt: 'Levonorgestrel', category: 'Tablet', suggestedPrice: 95, tabletsPerStrip: 1 },
    { name: 'Ulipristal 30mg', brand: 'Ella', salt: 'Ulipristal', category: 'Tablet', suggestedPrice: 450, tabletsPerStrip: 1 },

    // ============ LIPID LOWERING ============
    { name: 'Atorvastatin 10mg', brand: 'Atorva', salt: 'Atorvastatin', category: 'Tablet', suggestedPrice: 95, tabletsPerStrip: 10 },
    { name: 'Atorvastatin 20mg', brand: 'Atorva', salt: 'Atorvastatin', category: 'Tablet', suggestedPrice: 135, tabletsPerStrip: 10 },
    { name: 'Rosuvastatin 10mg', brand: 'Rozavel', salt: 'Rosuvastatin', category: 'Tablet', suggestedPrice: 145, tabletsPerStrip: 10 },
    { name: 'Rosuvastatin 20mg', brand: 'Rozavel', salt: 'Rosuvastatin', category: 'Tablet', suggestedPrice: 195, tabletsPerStrip: 10 },
    { name: 'Fenofibrate 145mg', brand: 'Lipanthyl', salt: 'Fenofibrate', category: 'Tablet', suggestedPrice: 165, tabletsPerStrip: 10 },

    // ============ ANTIPLATELET ============
    { name: 'Clopidogrel 75mg', brand: 'Clopilet', salt: 'Clopidogrel', category: 'Tablet', suggestedPrice: 95, tabletsPerStrip: 10 },
    { name: 'Aspirin + Clopidogrel', brand: 'Ecosprin-AV', salt: 'Aspirin + Clopidogrel', category: 'Capsule', suggestedPrice: 145, tabletsPerStrip: 10 },
    { name: 'Prasugrel 10mg', brand: 'Prasit', salt: 'Prasugrel', category: 'Tablet', suggestedPrice: 185, tabletsPerStrip: 10 },
    { name: 'Ticagrelor 90mg', brand: 'Brilinta', salt: 'Ticagrelor', category: 'Tablet', suggestedPrice: 550, tabletsPerStrip: 14 },

    // ============ ANTICOAGULANTS ============
    { name: 'Warfarin 5mg', brand: 'Warf', salt: 'Warfarin', category: 'Tablet', suggestedPrice: 35, tabletsPerStrip: 10 },
    { name: 'Rivaroxaban 10mg', brand: 'Xarelto', salt: 'Rivaroxaban', category: 'Tablet', suggestedPrice: 450, tabletsPerStrip: 10 },
    { name: 'Dabigatran 110mg', brand: 'Pradaxa', salt: 'Dabigatran', category: 'Capsule', suggestedPrice: 550, tabletsPerStrip: 10 },
    { name: 'Apixaban 2.5mg', brand: 'Eliquis', salt: 'Apixaban', category: 'Tablet', suggestedPrice: 450, tabletsPerStrip: 10 },

    // ============ UROLOGY ============
    { name: 'Tamsulosin 0.4mg', brand: 'Urimax', salt: 'Tamsulosin', category: 'Capsule', suggestedPrice: 145, tabletsPerStrip: 10 },
    { name: 'Alfuzosin 10mg', brand: 'Alfoo', salt: 'Alfuzosin', category: 'Tablet', suggestedPrice: 185, tabletsPerStrip: 10 },
    { name: 'Silodosin 8mg', brand: 'Silodal', salt: 'Silodosin', category: 'Capsule', suggestedPrice: 280, tabletsPerStrip: 10 },
    { name: 'Finasteride 5mg', brand: 'Finpecia', salt: 'Finasteride', category: 'Tablet', suggestedPrice: 195, tabletsPerStrip: 10 },
    { name: 'Dutasteride 0.5mg', brand: 'Dutas', salt: 'Dutasteride', category: 'Capsule', suggestedPrice: 280, tabletsPerStrip: 10 },
    { name: 'Sildenafil 50mg', brand: 'Viagra', salt: 'Sildenafil', category: 'Tablet', suggestedPrice: 450, tabletsPerStrip: 4 },
    { name: 'Tadalafil 10mg', brand: 'Cialis', salt: 'Tadalafil', category: 'Tablet', suggestedPrice: 550, tabletsPerStrip: 4 },

    // ============ GOUT ============
    { name: 'Allopurinol 100mg', brand: 'Zyloric', salt: 'Allopurinol', category: 'Tablet', suggestedPrice: 35, tabletsPerStrip: 10 },
    { name: 'Allopurinol 300mg', brand: 'Zyloric', salt: 'Allopurinol', category: 'Tablet', suggestedPrice: 65, tabletsPerStrip: 10 },
    { name: 'Febuxostat 40mg', brand: 'Feburic', salt: 'Febuxostat', category: 'Tablet', suggestedPrice: 165, tabletsPerStrip: 10 },
    { name: 'Febuxostat 80mg', brand: 'Feburic', salt: 'Febuxostat', category: 'Tablet', suggestedPrice: 220, tabletsPerStrip: 10 },
    { name: 'Colchicine 0.5mg', brand: 'Zycolchin', salt: 'Colchicine', category: 'Tablet', suggestedPrice: 45, tabletsPerStrip: 20 },

    // ============ LAXATIVES ============
    { name: 'Isabgol Husk', brand: 'Sat-Isabgol', salt: 'Psyllium Husk', category: 'Powder', suggestedPrice: 145 },
    { name: 'Lactulose Syrup', brand: 'Duphalac', salt: 'Lactulose', category: 'Syrup', suggestedPrice: 185 },
    { name: 'Bisacodyl 5mg', brand: 'Dulcolax', salt: 'Bisacodyl', category: 'Tablet', suggestedPrice: 35, tabletsPerStrip: 10 },
    { name: 'Polyethylene Glycol', brand: 'Peglec', salt: 'PEG 3350', category: 'Powder', suggestedPrice: 250 },
    { name: 'Sodium Picosulfate', brand: 'Cremalax', salt: 'Sodium Picosulfate', category: 'Syrup', suggestedPrice: 95 },

    // ============ ANTIFUNGAL ORAL ============
    { name: 'Fluconazole 150mg', brand: 'Flucos', salt: 'Fluconazole', category: 'Tablet', suggestedPrice: 95, tabletsPerStrip: 1 },
    { name: 'Fluconazole 200mg', brand: 'Flucos', salt: 'Fluconazole', category: 'Tablet', suggestedPrice: 145, tabletsPerStrip: 4 },
    { name: 'Itraconazole 100mg', brand: 'Canditral', salt: 'Itraconazole', category: 'Capsule', suggestedPrice: 185, tabletsPerStrip: 4 },
    { name: 'Terbinafine 250mg', brand: 'Terbicip', salt: 'Terbinafine', category: 'Tablet', suggestedPrice: 195, tabletsPerStrip: 14 },
    { name: 'Griseofulvin 500mg', brand: 'Grisovin', salt: 'Griseofulvin', category: 'Tablet', suggestedPrice: 95, tabletsPerStrip: 10 },

    // ============ ANTIVIRAL ============
    { name: 'Acyclovir 400mg', brand: 'Zovirax', salt: 'Acyclovir', category: 'Tablet', suggestedPrice: 95, tabletsPerStrip: 10 },
    { name: 'Acyclovir 800mg', brand: 'Zovirax', salt: 'Acyclovir', category: 'Tablet', suggestedPrice: 145, tabletsPerStrip: 10 },
    { name: 'Valacyclovir 500mg', brand: 'Valcivir', salt: 'Valacyclovir', category: 'Tablet', suggestedPrice: 285, tabletsPerStrip: 10 },
    { name: 'Famciclovir 250mg', brand: 'Famtrex', salt: 'Famciclovir', category: 'Tablet', suggestedPrice: 350, tabletsPerStrip: 6 },

    // ============ DENTAL ============  
    { name: 'Clove Oil', brand: 'Dabur Clove', salt: 'Eugenol', category: 'Drops', suggestedPrice: 45 },
    { name: 'Benzocaine Gel', brand: 'Orajel', salt: 'Benzocaine', category: 'Cream', suggestedPrice: 95 },
    { name: 'Chlorhexidine Mouthwash', brand: 'Hexidine', salt: 'Chlorhexidine', category: 'Other', suggestedPrice: 125 },

    // ============ FIRST AID ============
    { name: 'Povidone Iodine Solution', brand: 'Betadine', salt: 'Povidone Iodine', category: 'Other', suggestedPrice: 85 },
    { name: 'Hydrogen Peroxide', brand: 'Hydrogen Peroxide', salt: 'Hydrogen Peroxide', category: 'Other', suggestedPrice: 35 },
    { name: 'Dettol Antiseptic', brand: 'Dettol', salt: 'Chloroxylenol', category: 'Other', suggestedPrice: 95 },
    { name: 'Band-Aid Strips', brand: 'Johnson & Johnson', salt: 'Adhesive Bandage', category: 'Other', suggestedPrice: 55 },
    { name: 'Cotton Roll', brand: 'Softpore', salt: 'Cotton', category: 'Other', suggestedPrice: 45 },
    { name: 'Surgical Tape', brand: 'Micropore', salt: 'Surgical Tape', category: 'Other', suggestedPrice: 65 },
];

/**
 * Search medicine database by name, brand, or salt
 * Returns matches sorted by relevance
 */
export function searchMedicineDatabase(query: string, limit: number = 10): MedicineTemplate[] {
    if (!query || query.length < 2) return [];

    const searchTerm = query.toLowerCase().trim();

    // Score each medicine based on match quality
    const scored = MEDICINE_DATABASE.map(med => {
        const name = med.name.toLowerCase();
        const brand = med.brand.toLowerCase();
        const salt = med.salt.toLowerCase();

        let score = 0;

        // Exact start match = highest score
        if (name.startsWith(searchTerm)) score += 100;
        else if (brand.startsWith(searchTerm)) score += 90;
        else if (salt.startsWith(searchTerm)) score += 80;

        // Contains match
        else if (name.includes(searchTerm)) score += 50;
        else if (brand.includes(searchTerm)) score += 40;
        else if (salt.includes(searchTerm)) score += 30;

        // Word start match (e.g., "para" matches "Paracetamol")
        const words = [...name.split(' '), ...brand.split(' '), ...salt.split(' ')];
        if (words.some(w => w.toLowerCase().startsWith(searchTerm))) score += 60;

        return { med, score };
    });

    // Filter and sort by score
    return scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.med);
}

/**
 * Get total count of medicines in database
 */
export function getMedicineDatabaseCount(): number {
    return MEDICINE_DATABASE.length;
}
