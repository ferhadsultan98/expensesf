from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

# Verilənlər bazasına qoşulma və istifadəçi məlumatlarını əldə etmək
def get_user_expenses(user_id):
    conn = sqlite3.connect('expenses.db')
    c = conn.cursor()
    c.execute("SELECT * FROM expenses WHERE user_id = ?", (user_id,))
    data = c.fetchone()
    conn.close()

    if data:
        return {
            "name": data[0],  # Ad
            "restaurant": data[1],
            "food": data[2],
            "transport": data[3],
            "entertainment": data[4],
            "education": data[5],
            "sports": data[6],
            "technology": data[7]
        }
    return None

# Xərcləri təhlil edib qənaət tövsiyələri vermək
def savings_recommendations(expenses):
    recommendations = []

    if expenses['restaurant'] > 100:
        recommendations.append("Restoranlarda çox xərc edirsiniz. Daha ucuz restoranlar seçmək və ya evdə yemək hazırlamaqla xərclərinizi 20-30% azalda bilərsiniz.")
    
    if expenses['food'] > 200:
        recommendations.append("Qida xərcləriniz yüksəkdir. Həftəlik bazar planı hazırlayaraq alış-verişi optimallaşdırmaqla 10-15% qənaət edə bilərsiniz.")
    
    if expenses['transport'] > 50:
        recommendations.append("Nəqliyyat xərclərini azaltmaq üçün avtomobil istifadəsini minimuma endirmək, daha çox ictimai nəqliyyat istifadə etmək və ya daha sərfəli yollar tapmaqla qənaət edə bilərsiniz.")
    
    if expenses['entertainment'] > 100:
        recommendations.append("Əyləncə üçün çox xərc edirsiniz. Daha ucuz və ya pulsuz əyləncə variantları tapmaqla xərclərinizi 20-30% azalda bilərsiniz.")
    
    if expenses['education'] > 150:
        recommendations.append("Təhsil xərcləri yüksəkdir. Online təlimlər və açıq mənbəli resurslardan istifadə etməklə 25-30% qənaət edə bilərsiniz.")
    
    if expenses['sports'] > 50:
        recommendations.append("İdman xərclərini azaltmaq üçün daha ucuz idman zalı seçmək və ya evdə idman etmək xərcləri azaltmağa kömək edə bilər.")
    
    if expenses['technology'] > 200:
        recommendations.append("Texnologiya xərcləriniz çox yüksəkdir. Yeni avadanlıqlar almadan əvvəl ehtiyaclarınıza uyğun seçimlər edin.")
    
    return recommendations

@app.route('/')
def index():
    return render_template('index.html')

# İlk qarşılanma mərhələsi: istifadəçi ilə yazışma
@app.route('/start_conversation', methods=['GET'])
def start_conversation():
    return jsonify({'response': "Salam! Mən sizin maliyyə xərclərinizi optimallaşdırmaq üçün buradayam. Xahiş edirəm, istifadəçi ID-nizi daxil edin."})

# İstifadəçi ID-sini alıb, xərcləri təhlil edərək cavab vermək
@app.route('/get_savings', methods=['POST'])
def get_savings():
    user_id = request.json.get('user_id')
    expenses = get_user_expenses(user_id)
    
    if expenses:
        recommendations = savings_recommendations(expenses)
        response_message = f"Salam, {expenses['name']}! Məlumatlarınız yoxlanılır, qısa zamanda geri dönəcəyik."
        return jsonify({'response': response_message, 'recommendations': recommendations})
    else:
        return jsonify({'error': 'İstifadəçi tapılmadı. Lütfən doğru ID daxil etdiyinizdən əmin olun.'}), 404

if __name__ == '__main__':
    app.run(debug=True)
