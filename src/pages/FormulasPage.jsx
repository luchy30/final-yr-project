import { motion } from 'framer-motion'
import { Latex } from '../components/Latex'

export function FormulasPage() {
  return (
    <motion.div
      key="formulas-page"
      className="form-view-container"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="form-block-heading" style={{ marginTop: 0 }}>
          Theoretical Petroleum Engineering Formulas
        </h2>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
          Mathematical formulations implemented across fluid classification, gas deviation factor correlations, volumetric reserves, material balance, and Arps decline curve analysis.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Section 1: Gas Deviation Factor Z Correlations */}
        <div className="standard-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
            1. Gas Compressibility Factor (Z-Factor) Correlations
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
            The deviation of real gas behaviour from the ideal gas law at elevated reservoir pressures and temperatures.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Hall-Yarborough EOS */}
            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Hall and Yarborough Equation of State (1973)
              </div>
              <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
                <Latex
                  block
                  math="F(Y) = -0.06125 P_{pr} t e^{-1.2(1-t)^2} + \frac{Y + Y^2 + Y^3 - Y^4}{(1-Y)^3} - (14.76 t - 9.76 t^2 + 4.58 t^3) Y^2 + (90.7 t - 242.2 t^2 + 42.4 t^3) Y^{2.18 + 2.82 t} = 0"
                />
              </div>
              <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
                <Latex
                  block
                  math="Z = \frac{0.06125 P_{pr} t}{Y} \exp\left[-1.2 (1 - t)^2\right]"
                />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                Where t = 1 / Tpr is reciprocal pseudo-reduced temperature, and Y is reduced gas density solved through Newton-Raphson iteration.
              </p>
            </div>

            {/* Brill and Beggs */}
            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Brill and Beggs Explicit Empirical Correlation (1974)
              </div>
              <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
                <Latex
                  block
                  math="Z = A + \frac{1 - A}{\exp(B)} + C \cdot P_{pr}^D"
                />
              </div>
              <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
                <Latex
                  block
                  math="A = 1.39 (T_{pr} - 0.92)^{0.5} - 0.36 T_{pr} - 0.10"
                />
              </div>
              <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
                <Latex
                  block
                  math="B = (0.62 - 0.23 T_{pr}) P_{pr} + \left(\frac{0.066}{T_{pr} - 0.86} - 0.037\right) P_{pr}^2 + \frac{0.32 P_{pr}^6}{10^{9(T_{pr} - 1)}}"
                />
              </div>
              <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
                <Latex
                  block
                  math="C = 0.132 - 0.32 \log_{10}(T_{pr}), \quad D = 10^{(0.3106 - 0.49 T_{pr} + 0.1824 T_{pr}^2)}"
                />
              </div>
            </div>

            {/* Dranchuk and Abou-Kassem */}
            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Dranchuk and Abou-Kassem (DAK) 11-Constant EOS (1975)
              </div>
              <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
                <Latex
                  block
                  math="Z = 1 + \left(A_1 + \frac{A_2}{T_{pr}} + \frac{A_3}{T_{pr}^3} + \frac{A_4}{T_{pr}^4} + \frac{A_5}{T_{pr}^5}\right) \rho_r + \left(A_6 + \frac{A_7}{T_{pr}} + \frac{A_8}{T_{pr}^2}\right) \rho_r^2 - A_9 \left(\frac{A_7}{T_{pr}} + \frac{A_8}{T_{pr}^2}\right) \rho_r^5 + A_{10} \left(1 + A_{11} \rho_r^2\right) \left(\frac{\rho_r^2}{T_{pr}^3}\right) e^{-A_{11} \rho_r^2}"
                />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                Where reduced density rho_r = 0.27 Ppr / (Z Tpr), fitted to Standing-Katz chart data across 1500 data points.
              </p>
            </div>

            {/* Papay */}
            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Papay Correlation (1968)
              </div>
              <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
                <Latex
                  block
                  math="Z = 1 - \frac{3.52 P_{pr}}{10^{0.9813 T_{pr}}} + \frac{0.274 P_{pr}^2}{10^{0.8157 T_{pr}}}"
                />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                Fast polynomial evaluation suitable for moderate pressures and temperature ranges.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Pseudo-Critical Properties */}
        <div className="standard-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
            2. Pseudo-Critical Properties Estimation
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
            Critical temperature and critical pressure calculated from gas specific gravity.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Standing Linear Correlations
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="T_{pc} = 168 + 325 \gamma_g - 12.5 \gamma_g^2 \quad [^\circ\text{R}]" />
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="P_{pc} = 677 + 15.0 \gamma_g - 37.5 \gamma_g^2 \quad [\text{psia}]" />
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Sutton Quadratic Correlations
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="T_{pc} = 169.2 + 349.5 \gamma_g - 74.0 \gamma_g^2 \quad [^\circ\text{R}]" />
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="P_{pc} = 756.8 - 131.0 \gamma_g - 3.6 \gamma_g^2 \quad [\text{psia}]" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Gas Formation Volume Factor */}
        <div className="standard-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
            3. Gas Formation Volume Factor (Bg)
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
            Volume ratio of gas at reservoir temperature and pressure to standard surface conditions (14.7 psia, 60 deg F).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Cubic Feet per Standard Cubic Foot
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="B_g = 0.028279 \frac{Z T}{P} \quad \left[\frac{\text{ft}^3}{\text{scf}}\right]" />
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Reservoir Barrels per Standard Cubic Foot
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="B_g = 0.005035 \frac{Z T}{P} \quad \left[\frac{\text{rb}}{\text{scf}}\right]" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Volumetric Reserves */}
        <div className="standard-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
            4. Volumetric Gas Reserves and Recovery Factors
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
            Bulk volumetric calculation of original gas in place and recovery under volumetric depletion or water drive.
          </p>

          <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Original Gas in Place (GIIP)
            </div>
            <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
              <Latex block math="G = \frac{7758 \, A \, h \, \phi (1 - S_{wi})}{B_{gi}} \quad [\text{scf}]" />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
              Where A is drainage area in acres, h is net pay in feet, phi is porosity fraction, Swi is connate water saturation, and Bgi is initial gas formation volume factor in ft3/scf.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Volumetric Depletion Recovery Factor
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="RF_{vol} = 1 - \frac{P_a / Z_a}{P_i / Z_i}" />
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Water Drive Displacement Recovery Factor
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="RF_{wd} = \frac{1 - S_{wi} - S_{gr}}{1 - S_{wi}}" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Material Balance & Havlena-Odeh */}
        <div className="standard-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
            5. General Material Balance and Havlena-Odeh Formulation
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
            Conservation of mass equating cumulative underground withdrawal to fluid expansion and water encroachment.
          </p>

          <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              General Gas Material Balance Equation
            </div>
            <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
              <Latex
                block
                math="G (B_g - B_{gi}) + G B_{gi} \left(\frac{c_w S_{wi} + c_f}{1 - S_{wi}}\right) \Delta P + W_e = G_p B_g + B_w W_p"
              />
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Havlena-Odeh Linear Relationship (1963)
            </div>
            <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
              <Latex block math="F = G (E_g + E_{f,w}) + W_e" />
            </div>
            <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
              <Latex block math="F = G_p B_g + W_p B_w, \quad E_g = B_g - B_{gi}, \quad E_{f,w} = B_{gi} \left(\frac{c_w S_{wi} + c_f}{1 - S_{wi}}\right) \Delta P" />
            </div>
          </div>
        </div>

        {/* Section 6: Drive Energy Indices */}
        <div className="standard-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
            6. Reservoir Drive Energy Indices
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
            Proportion of cumulative fluid withdrawal supported by gas expansion, water influx, and rock/connate fluid compression.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Depletion Drive Index (IDD)
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="I_{DD} = \frac{G E_g}{F}" />
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Water Influx Drive Index (IWD)
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="I_{WD} = \frac{W_e - B_w W_p}{F}" />
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Rock and Fluid Index (ICD)
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="I_{CD} = \frac{G E_{f,w}}{F}" />
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>
            <Latex math="I_{DD} + I_{WD} + I_{CD} = 1.0" />
          </div>
        </div>

        {/* Section 7: Fetkovich Aquifer Water Influx */}
        <div className="standard-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
            7. Fetkovich Radial Aquifer Water Influx Model (1971)
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
            Semi-steady state approximation for encroachable water volume and aquifer influx rate into gas sands.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Maximum Encroachable Water (Wei)
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="W_{ei} = c_t W_i P_i \quad [\text{bbl}]" />
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Aquifer Productivity Index (J)
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="J = \frac{7.08 \times 10^{-3} k h}{\mu \left(\ln(r_a / r_0) - 0.75\right)}" />
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', marginTop: '1.25rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Incremental Water Influx
            </div>
            <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
              <Latex block math="\Delta W_e = \frac{W_{ei}}{P_i} \left(1 - \exp\left[-\frac{J P_i \Delta t}{W_{ei}}\right]\right) (P_{aq} - P_{res})" />
            </div>
          </div>
        </div>

        {/* Section 8: Arps Decline Curve Analysis */}
        <div className="standard-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
            8. Arps Production Decline Curve Analysis (1945)
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
            Empirical rate-time and cumulative production formulations representing depletion stages.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Exponential Decline (b = 0)
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="q(t) = q_i e^{-D t}" />
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="G_p(t) = \frac{q_i - q(t)}{D}" />
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Harmonic Decline (b = 1)
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="q(t) = \frac{q_i}{1 + D_i t}" />
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="G_p(t) = \frac{q_i}{D_i} \ln\left(\frac{q_i}{q(t)}\right)" />
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Hyperbolic Decline (0 &lt; b &lt; 1)
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="q(t) = \frac{q_i}{(1 + b D_i t)^{1/b}}" />
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="G_p(t) = \frac{q_i^b}{D_i (1 - b)} \left(q_i^{1-b} - q(t)^{1-b}\right)" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 9: SPE-PRMS Reserves Classification */}
        <div className="standard-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
            9. SPE-PRMS Probabilistic Reserves Methodology
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
            International petroleum resources management system standards based on cumulative probability distributions.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                1P Proved Reserves (P90)
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="1P = P_{90} \quad (90\% \text{ exceedance probability})" />
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                2P Proved plus Probable (P50)
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="2P = P_{50} \quad (50\% \text{ median expectation})" />
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                3P Proved plus Probable plus Possible
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="3P = P_{10} \quad (10\% \text{ high estimate})" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
