# Smart_Energy_Data_Visualizer
Smart Energy Data Visualizer using Python and IoT — A Streamlit-based dashboard for real-time and offline visualization of energy data, featuring anomaly detection, MQTT integration, and analytical insights.



## ⚙️ How to Run the Project

Follow the steps below to set up and run the **Smart Energy Data Visualizer using Python and IoT** on your local system.

---

### 🧩 1. Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/your-username/Smart_Energy_Data_Visualizer.git
Then navigate into the project folder:

bash
Copy code
cd Smart_Energy_Data_Visualizer
🐍 2. Create and Activate a Virtual Environment (Recommended)
For Windows:

bash
Copy code
python -m venv venv
venv\Scripts\activate
For macOS/Linux:

bash
Copy code
python3 -m venv venv
source venv/bin/activate
📦 3. Install Required Dependencies
Make sure you have all required Python libraries installed:

bash
Copy code
pip install -r requirements.txt
If you don’t have a requirements.txt file, you can manually install them:

bash
Copy code
pip install pandas streamlit matplotlib paho-mqtt numpy
📂 4. Add Your CSV or IoT Data File
Place your CSV data file (e.g., elog20231223.csv) inside the project directory.
Make sure the CSV file contains columns like:


🖥️ 5. Run the Streamlit Application
Start the Streamlit UI by running:

bash
Copy code
streamlit run app.py
🌐 6. Open in Browser
After running the above command, Streamlit will automatically launch in your default web browser.
If not, manually open the link shown in your terminal, usually:

arduino
Copy code
http://localhost:8501
