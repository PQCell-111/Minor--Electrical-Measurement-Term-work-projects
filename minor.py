import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import datetime

# --------------------------------------------
# Streamlit Config
# --------------------------------------------
st.set_page_config(page_title="Smart Energy Analyzer", layout="wide")

st.title("⚡ WattWatch: Smart Power Usage Dashboard")

# --------------------------------------------
# Sidebar - File Upload & Settings
# --------------------------------------------
st.sidebar.header("📂 Upload CSV File")
uploaded_file = st.sidebar.file_uploader("Choose your CSV file", type=["csv"])

# User-defined electricity rate
rate = st.sidebar.number_input("Set Electricity Rate (₹ per kWh)", min_value=0.0, max_value=50.0, value=8.0, step=0.5)

if uploaded_file is not None:
    try:
        # Read CSV file safely
        df = pd.read_csv(uploaded_file, sep=None, engine="python", skip_blank_lines=True)
        df.columns = [col.strip() for col in df.columns]

        # Detect time column automatically
        time_col = next((col for col in df.columns if "TIME" in col.upper()), None)
        if not time_col:
            st.error("❌ No Time column found in CSV file.")
            st.stop()

        # Convert to datetime safely
        df[time_col] = pd.to_datetime(df[time_col], errors="coerce")
        df = df.dropna(subset=[time_col])

        # Detect important columns
        voltage_col = next((c for c in df.columns if "Average Phase Voltage" in c), None)
        power_col = next((c for c in df.columns if "3 Phase Active Power" in c), None)
        pf_col = next((c for c in df.columns if "Total-PF" in c), None)

        if not all([voltage_col, power_col, pf_col]):
            st.error("❌ Missing one or more key columns.")
            st.write("Detected columns:", df.columns.tolist())
            st.stop()

        # Convert key columns to numeric safely
        for col in [voltage_col, power_col, pf_col]:
            df[col] = pd.to_numeric(df[col], errors="coerce")

        # Drop rows where any key column is missing
        df = df.dropna(subset=[voltage_col, power_col, pf_col])

        # -------------------------------
        # Time range slider
        # -------------------------------
        st.sidebar.subheader("⏱️ Select Time Range")
        min_time = df[time_col].min().to_pydatetime()
        max_time = df[time_col].max().to_pydatetime()

        start_time, end_time = st.sidebar.slider(
            "Select Time Window",
            min_value=min_time,
            max_value=max_time,
            value=(min_time, max_time),
            format="YYYY-MM-DD HH:mm:ss"
        )

        filtered = df[(df[time_col] >= pd.Timestamp(start_time)) & (df[time_col] <= pd.Timestamp(end_time))]

        if filtered.empty:
            st.warning("⚠️ No data found in this time range.")
            st.stop()

        # -------------------------------
        # Summary calculations
        # -------------------------------
        st.subheader("📊 Energy Summary")

        avg_voltage = filtered[voltage_col].mean()
        avg_power = filtered[power_col].mean()
        avg_pf = filtered[pf_col].mean()

        duration_hrs = (filtered[time_col].max() - filtered[time_col].min()).total_seconds() / 3600
        energy_kwh = (avg_power * duration_hrs) / 1000
        est_bill = energy_kwh * rate

        c1, c2, c3, c4, c5 = st.columns(5)
        c1.metric("Average Voltage (V)", f"{avg_voltage:.2f}")
        c2.metric("Average Power (W)", f"{avg_power:.2f}")
        c3.metric("Power Factor", f"{avg_pf:.3f}")
        c4.metric("Total Energy (kWh)", f"{energy_kwh:.4f}")
        c5.metric(f"Estimated Bill (₹ @ {rate:.1f}/kWh)", f"{est_bill:.2f}")

        # -------------------------------
        # Prepare data for plotting
        # -------------------------------
        st.subheader("📈 Parameter Graphs")

        # Ensure data is numeric before resampling (fixes agg function error)
        filtered_plot = filtered[[time_col, voltage_col, power_col, pf_col]].copy()

        # Set index for resampling
        filtered_plot = filtered_plot.set_index(time_col)

        # Convert object columns to numeric safely again before averaging
        filtered_plot = filtered_plot.apply(pd.to_numeric, errors="coerce")

        # Resample if large dataset
        if len(filtered_plot) > 2000:
            filtered_plot = filtered_plot.resample('1min').mean()

        filtered_plot = filtered_plot.dropna().reset_index()
        filtered_plot["Time (hrs)"] = filtered_plot[time_col].dt.strftime("%H:%M")

        def style_plot(ax, title, y_label):
            ax.set_title(title, fontsize=13)
            ax.set_xlabel("Time (hrs)", fontsize=11)
            ax.set_ylabel(y_label, fontsize=11)
            ax.grid(True, linestyle="--", alpha=0.5)
            step = max(1, len(filtered_plot)//10)
            ax.set_xticks(filtered_plot.index[::step])
            ax.set_xticklabels(filtered_plot["Time (hrs)"].iloc[::step], rotation=0)
            plt.tight_layout()

        # Voltage graph
        fig1, ax1 = plt.subplots(figsize=(10, 4))
        ax1.plot(filtered_plot.index, filtered_plot[voltage_col], color='orange')
        style_plot(ax1, "Average Phase Voltage (V)", "Voltage (V)")
        st.pyplot(fig1)

        # Power graph
        fig2, ax2 = plt.subplots(figsize=(10, 4))
        ax2.plot(filtered_plot.index, filtered_plot[power_col], color='green')
        style_plot(ax2, "3-Phase Active Power (W)", "Power (W)")
        st.pyplot(fig2)

        # Power Factor graph
        fig3, ax3 = plt.subplots(figsize=(10, 4))
        ax3.plot(filtered_plot.index, filtered_plot[pf_col], color='blue')
        style_plot(ax3, "Power Factor", "PF")
        st.pyplot(fig3)

        # -------------------------------
        # Data preview
        # -------------------------------
        st.subheader("📋 Filtered Data Preview")
        st.dataframe(filtered.head(20))

        # -------------------------------
        # Download filtered CSV
        # -------------------------------
        st.sidebar.subheader("💾 Download Filtered Data")
        csv_download = filtered.to_csv(index=False).encode('utf-8')
        st.sidebar.download_button(
            label="📥 Download CSV",
            data=csv_download,
            file_name="filtered_energy_data.csv",
            mime="text/csv"
        )

    except Exception as e:
        st.error(f"Error reading file: {e}")

else:
    st.info("👈 Upload a CSV file to begin.")
