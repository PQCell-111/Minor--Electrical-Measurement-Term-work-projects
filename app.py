# Smart Energy Data Visualizer with Attractive Streamlit UI (Enhanced Version)
# -------------------------------------------------------------

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import paho.mqtt.client as mqtt
from datetime import datetime
import threading
import time
import os

# -------------------------------------------------------------
# 💫 PAGE CONFIGURATION
# -------------------------------------------------------------
st.set_page_config(
    page_title="Smart Energy Data Visualizer",
    page_icon="⚡",
    layout="wide",
)

# -------------------------------------------------------------
# 🎨 CUSTOM STYLING
# -------------------------------------------------------------
st.markdown("""
    <style>
    body {
        background-color: #f8f9fa;
    }
    .main-title {
        text-align: center;
        font-size: 2.5em;
        color: #2E86C1;
        font-weight: bold;
        margin-bottom: 10px;
    }
    .sub-title {
        text-align: center;
        color: #555;
        margin-bottom: 40px;
    }
    .stMetric {
        background: #ffffff;
        padding: 10px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    </style>
""", unsafe_allow_html=True)

# -------------------------------------------------------------
# ⚙️ FUNCTIONS
# -------------------------------------------------------------
def load_energy_data(csv_file):
    """Load and preprocess energy data from CSV."""
    try:
        df = pd.read_csv(csv_file, sep=';', engine='python')
    except Exception:
        df = pd.read_csv(csv_file)

    # Identify and convert time column
    for col in df.columns:
        if 'time' in col.lower() or 'date' in col.lower():
            df[col] = pd.to_datetime(df[col], errors='coerce')
            df = df.dropna(subset=[col])
            df = df.sort_values(by=col)
            df.rename(columns={col: 'Timestamp'}, inplace=True)
            break

    # Convert numeric columns
    for col in df.columns:
        if df[col].dtype == object:
            df[col] = pd.to_numeric(df[col].astype(str).str.replace(',', '.'), errors='coerce')

    df = df.dropna(axis=1, how='all')
    return df


def compute_energy_stats(df):
    """Compute key statistics for numeric columns."""
    numeric_cols = df.select_dtypes(include='number').columns
    stats = df[numeric_cols].describe().T[['mean', 'std', 'min', 'max']]
    stats.rename(columns={'mean': 'Avg', 'std': 'Std Dev', 'min': 'Min', 'max': 'Max'}, inplace=True)
    return stats


def detect_anomalies(df, col_name, threshold=3):
    """Detect anomalies using Z-score."""
    if col_name not in df.columns:
        return pd.DataFrame()
    mean = df[col_name].mean()
    std = df[col_name].std()
    df['Z'] = (df[col_name] - mean) / std
    anomalies = df[abs(df['Z']) > threshold]
    return anomalies


LIVE_DATA_FILE = "live_data.csv"


def start_mqtt_listener(broker, topic):
    """Start MQTT data listener."""
    def on_connect(client, userdata, flags, rc):
        print("Connected to MQTT broker:", rc)
        client.subscribe(topic)

    def on_message(client, userdata, msg):
        payload = msg.payload.decode()
        timestamp = datetime.now().isoformat()
        with open(LIVE_DATA_FILE, "a") as f:
            f.write(f"{timestamp},{payload}\n")
        print("Received:", payload)

    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(broker, 1883, 60)
    client.loop_forever()


# -------------------------------------------------------------
# ⚡ APP HEADER
# -------------------------------------------------------------
st.markdown("<div class='main-title'>⚡ Smart Energy Data Visualizer</div>", unsafe_allow_html=True)
st.markdown("<div class='sub-title'>Analyze, Monitor, and Detect Anomalies in Energy Data using Python + IoT</div>", unsafe_allow_html=True)

st.sidebar.header("📡 Data Input Options")
data_mode = st.sidebar.radio("Choose Data Source", ["📁 Upload CSV", "🌐 Live IoT (MQTT)"])

# -------------------------------------------------------------
# 📁 CSV UPLOAD MODE
# -------------------------------------------------------------
if "Upload CSV" in data_mode:
    uploaded_file = st.file_uploader("Upload your energy meter CSV file", type=["csv"])
    
    if uploaded_file:
        df = load_energy_data(uploaded_file)

        st.subheader("📄 Data Preview")
        st.dataframe(df.head(10), use_container_width=True)

        # --- Key Statistics ---
        st.subheader("📊 Key Statistics")
        stats = compute_energy_stats(df)

        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Avg Voltage", f"{stats['Avg'].mean():.2f} V")
        col2.metric("Min Value", f"{stats['Min'].min():.2f}")
        col3.metric("Max Value", f"{stats['Max'].max():.2f}")
        col4.metric("Std Deviation", f"{stats['Std Dev'].mean():.2f}")

        st.dataframe(stats, use_container_width=True)

        # --- Time-based Comparison Plot ---
        st.subheader("📈 Parameter Comparison Over Time")

        if 'Timestamp' in df.columns:
            time_col = 'Timestamp'
            numeric_cols = df.select_dtypes(include='number').columns.tolist()

            selected_cols = st.multiselect(
                "Select up to 3 Parameters to Compare", numeric_cols, default=numeric_cols[:3]
            )

            if selected_cols:
                fig = go.Figure()

                for col in selected_cols:
                    fig.add_trace(go.Scatter(
                        x=df[time_col],
                        y=df[col],
                        mode='lines',
                        name=col,
                        line=dict(width=2)
                    ))

                fig.update_layout(
                    title=dict(
                        text="⚡ Parameter Comparison Over Time",
                        x=0.5,
                        font=dict(size=18, color='#1F618D', family='Arial Black')
                    ),
                    xaxis_title="Time",
                    yaxis_title="Value",
                    xaxis=dict(
                        tickformat="%m-%d %H:%M",
                        tickangle=-30,
                        showgrid=True,
                        gridcolor='lightgray'
                    ),
                    yaxis=dict(showgrid=True, gridcolor='lightgray'),
                    plot_bgcolor='white',
                    hovermode='x unified',
                    legend=dict(
                        title="Parameters",
                        orientation="h",
                        yanchor="bottom",
                        y=1.02,
                        xanchor="center",
                        x=0.5
                    )
                )

                st.plotly_chart(fig, use_container_width=True)
            else:
                st.warning("Please select at least one parameter to visualize.")
        else:
            st.error("No time column found in CSV. Please ensure your file has a timestamp column.")

        # --- Anomaly Detection ---
        st.subheader("⚠️ Detected Anomalies")
        selected_col = st.selectbox("Select Parameter for Anomaly Detection", numeric_cols)
        anomalies = detect_anomalies(df, selected_col)
        st.info(f"Anomalies Found: {len(anomalies)}")
        if not anomalies.empty:
            st.dataframe(anomalies[[time_col, selected_col]].head(10))
    else:
        st.info("Upload your CSV file to begin analysis.")

# -------------------------------------------------------------
# 🌐 MQTT LIVE MODE
# -------------------------------------------------------------
else:
    broker = st.sidebar.text_input("MQTT Broker Address", "test.mosquitto.org")
    topic = st.sidebar.text_input("MQTT Topic", "smartenergy/data")
    auto_refresh = st.sidebar.checkbox("🔁 Auto Refresh (5s)", value=True)
    start_btn = st.sidebar.button("▶️ Start Listener")

    if start_btn:
        if not os.path.exists(LIVE_DATA_FILE):
            with open(LIVE_DATA_FILE, "w") as f:
                f.write("timestamp,payload\n")
        threading.Thread(target=start_mqtt_listener, args=(broker, topic), daemon=True).start()
        st.sidebar.success("✅ MQTT Listener Started")
        time.sleep(2)

    st.subheader("📶 Live IoT Data Feed")

    if os.path.exists(LIVE_DATA_FILE):
        df_live = pd.read_csv(LIVE_DATA_FILE)
        st.dataframe(df_live.tail(10), use_container_width=True)

        if len(df_live) > 5:
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=df_live.index,
                y=df_live.iloc[:, 1],
                mode='lines',
                name='Live Data',
                line=dict(width=2, color='#117A65')
            ))
            fig.update_layout(
                title="📡 Live IoT Data Stream",
                xaxis_title="Samples",
                yaxis_title="Payload",
                plot_bgcolor='white'
            )
            st.plotly_chart(fig, use_container_width=True)

        if auto_refresh:
            time.sleep(5)
            st.experimental_rerun()
    else:
        st.warning("No live data yet. Start MQTT listener to begin capturing data.")

# -------------------------------------------------------------
# END OF FILE
# -------------------------------------------------------------
