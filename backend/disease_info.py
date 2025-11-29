"""
Disease Information Database
Mapping dari class name ke informasi lengkap (gejala, treatment, pencegahan)
"""

DISEASE_INFO = {
    "Canker": {
        "disease": "Citrus Canker (Kanker Jeruk)",
        "severity": "tinggi",
        "description": "Penyakit bakteri yang menyebabkan lesi pada daun, buah, dan ranting jeruk. Disebabkan oleh Xanthomonas citri.",
        "symptoms": [
            "Bercak coklat dengan lingkaran kuning di sekitarnya",
            "Permukaan daun yang menonjol atau cekung",
            "Daun menggulung dan rontok prematur",
            "Buah berbintik dan berkeropeng"
        ],
        "treatment": [
            "Pangkas dan bakar bagian tanaman yang terinfeksi",
            "Semprot dengan bakterisida berbasis tembaga (Copper hydroxide 77%)",
            "Aplikasikan setiap 7-10 hari saat musim hujan",
            "Isolasi tanaman yang terinfeksi dari tanaman sehat",
            "Gunakan antibiotik streptomycin sulfate 20% (100-200 ppm)"
        ],
        "prevention": [
            "Gunakan bibit yang bersertifikat bebas penyakit",
            "Hindari pemangkasan saat musim hujan",
            "Jaga jarak tanam yang cukup (minimal 5-6 meter)",
            "Sanitasi alat pangkas dengan disinfektan",
            "Pasang windbreak untuk mengurangi penyebaran"
        ]
    },
    "Greening": {
        "disease": "Citrus Greening (Huanglongbing/HLB)",
        "severity": "tinggi",
        "description": "Penyakit mematikan yang disebabkan oleh bakteri Candidatus Liberibacter asiaticus, ditularkan oleh kutu Diaphorina citri.",
        "symptoms": [
            "Daun menguning tidak merata (blotchy mottle)",
            "Tulang daun tetap hijau saat daun menguning",
            "Buah kecil, asimetris, dan tidak matang sempurna",
            "Ranting mengering dari ujung ke pangkal"
        ],
        "treatment": [
            "TIDAK ADA OBAT - Segera cabut dan musnahkan tanaman terinfeksi",
            "Kendalikan vektor kutu dengan insektisida sistemik (Imidacloprid 20% SL)",
            "Aplikasi antibiotik Oxytetracycline untuk memperlambat gejala",
            "Injeksi trunk dengan Penicillin G (dosis 0.5-1 gram/pohon)",
            "Tingkatkan nutrisi tanaman dengan pemupukan berimbang"
        ],
        "prevention": [
            "Gunakan bibit bebas penyakit dari sumber terpercaya",
            "Pasang perangkap kuning untuk monitoring kutu",
            "Semprot insektisida secara rutin (interval 2 minggu)",
            "Tanam varietas yang lebih toleran",
            "Lakukan roguing (pencabutan) tanaman terinfeksi segera"
        ]
    },
    "Melanose": {
        "disease": "Melanose",
        "severity": "sedang",
        "description": "Penyakit jamur yang disebabkan oleh Diaporthe citri, menginfeksi daun muda dan buah.",
        "symptoms": [
            "Bintik-bintik kecil coklat kehitaman pada daun",
            "Permukaan kasar seperti amplas pada buah",
            "Daun muda lebih rentan terserang",
            "Lesi berbentuk tidak beraturan"
        ],
        "treatment": [
            "Aplikasikan fungisida berbasis tembaga (Copper oxychloride 50% WP)",
            "Semprot Mancozeb 80% WP dengan dosis 2-3 gram/liter",
            "Lakukan penyemprotan saat tunas baru muncul",
            "Ulangi aplikasi setiap 10-14 hari",
            "Pangkas ranting yang mati untuk mengurangi inokulum"
        ],
        "prevention": [
            "Pemangkasan untuk meningkatkan sirkulasi udara",
            "Hindari penyiraman dari atas (overhead irrigation)",
            "Bersihkan sisa-sisa tanaman yang gugur",
            "Aplikasi fungisida preventif saat musim hujan",
            "Jaga kelembaban kebun tidak terlalu tinggi"
        ]
    },
    "Black spot": {
        "disease": "Black Spot (Bercak Hitam)",
        "severity": "sedang",
        "description": "Penyakit jamur yang disebabkan oleh Phyllosticta citricarpa, menyerang buah dan daun jeruk.",
        "symptoms": [
            "Bercak hitam bulat dengan tepi coklat pada buah",
            "Bercak cekung dengan titik hitam di tengah",
            "Daun dengan lesi coklat kehitaman",
            "Buah rontok prematur jika infeksi parah"
        ],
        "treatment": [
            "Semprot dengan fungisida Azoxystrobin 25% SC (0.5 ml/liter)",
            "Aplikasikan Copper hydroxide setiap 2-3 minggu",
            "Gunakan Mancozeb + Metalaxyl untuk proteksi ganda",
            "Semprot saat bunga mekar hingga buah muda terbentuk",
            "Kumpulkan dan musnahkan buah yang terinfeksi"
        ],
        "prevention": [
            "Sanitasi kebun dengan membuang buah gugur",
            "Pemangkasan untuk meningkatkan penetrasi cahaya",
            "Hindari kelembaban berlebih",
            "Rotasi fungisida untuk menghindari resistensi",
            "Aplikasi fungisida preventif sebelum musim hujan"
        ]
    },
    "Healthy": {
        "disease": "Daun Sehat",
        "severity": "rendah",
        "description": "Daun dalam kondisi sehat, tidak terdeteksi gejala penyakit.",
        "symptoms": [
            "Warna hijau merata dan cerah",
            "Permukaan daun halus tanpa bercak",
            "Pertumbuhan normal dan vigor baik",
            "Tidak ada kerusakan atau lesi"
        ],
        "treatment": [
            "Tidak diperlukan perawatan khusus",
            "Lanjutkan pemeliharaan rutin",
            "Monitoring berkala untuk deteksi dini penyakit"
        ],
        "prevention": [
            "Pemupukan berimbang (NPK + mikronutrien)",
            "Penyiraman teratur sesuai kebutuhan",
            "Pemangkasan sanitasi untuk sirkulasi udara",
            "Monitoring hama dan penyakit secara berkala",
            "Jaga kebersihan area sekitar tanaman"
        ]
    }
}

def get_disease_info(class_name: str) -> dict:
    """
    Ambil informasi lengkap disease berdasarkan class name
    
    Args:
        class_name: Nama class dari ML model (e.g., 'Canker', 'Healthy')
    
    Returns:
        Dictionary berisi disease, severity, description, symptoms, treatment, prevention
    """
    return DISEASE_INFO.get(class_name, {
        "disease": class_name,
        "severity": "tidak diketahui",
        "description": "Informasi tidak tersedia",
        "symptoms": [],
        "treatment": [],
        "prevention": []
    })

