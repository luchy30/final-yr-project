import { motion } from 'framer-motion'
import { Latex } from '../components/Latex'
import { useReservoir } from '../context/useReservoir'

export function FormulasPage() {
  const { searchQuery } = useReservoir()
  const q = searchQuery.trim().toLowerCase()
  const matches = (keywords) => !q || keywords.toLowerCase().includes(q)

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
          Mathematical formulations implemented across fluid classification, gas compressibility correlations, volumetric reserves, material balance, Pot and Schilthuis water influx, and Arps production forecasting.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Section 1: Gas Deviation Factor Z Correlations */}
        {matches('z factor compressibility hall yarborough brill beggs dranchuk abou kassem') && (
          <div className="standard-card">
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
              1. Gas Compressibility Factor (Z-Factor) Correlations
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
              Empirical and equation of state correlations for determining real gas deviation Z at reservoir pressure and temperature.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Hall and Yarborough Correlation
                </div>
                <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
                  <Latex
                    block
                    math="Z = \frac{0.06125 P_{pr} t}{Y} \exp\left[-1.2 (1 - t)^2\right]"
                  />
                </div>
                <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
                  <Latex
                    block
                    math="F(Y) = X_1 + \frac{Y + Y^2 + Y^3 - Y^4}{(1 - Y)^3} - X_2 Y^2 + X_3 Y^{X_4} = 0"
                  />
                </div>
                <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
                  <Latex
                    block
                    math="X_1 = -0.06125 \cdot P_{pr} \cdot t \cdot \exp\left[-1.2 \cdot (1 - t)^2\right]"
                  />
                </div>
                <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
                  <Latex
                    block
                    math="X_2 = 14.76 t - 9.76 t^2 + 4.58 t^3, \quad X_3 = 90.7 t - 242.2 t^2 + 42.4 t^3, \quad X_4 = 2.18 + 2.82 t"
                  />
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                  Where t = 1 / Tpr is reciprocal pseudo-reduced temperature, and reduced density parameter Y is determined numerically using the Newton-Raphson method.
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Brill and Beggs Correlation
                </div>
                <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
                  <Latex
                    block
                    math="Z = A + \frac{1 - A}{e^B} + C \cdot P_{pr}^D"
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
                    math="B = (0.62 - 0.23 T_{pr}) P_{pr} + \left(\frac{0.066}{T_{pr} - 0.86} - 0.037\right) P_{pr}^2 + \frac{0.32 P_{pr}^6}{10^E}"
                  />
                </div>
                <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
                  <Latex
                    block
                    math="C = 0.132 - 0.32 \log_{10}(T_{pr}), \quad D = 10^F, \quad E = 9 (T_{pr} - 1), \quad F = 0.3106 - 0.49 T_{pr} + 0.1824 T_{pr}^2"
                  />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Dranchuk and Abou-Kassem (DAK) Analytical Expression
                </div>
                <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
                  <Latex
                    block
                    math="Z = \frac{0.27 P_{pr}}{\rho_r T_{pr}}"
                  />
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                  Eleven constant analytical expression iteratively solved for reduced gas density in terms of pseudo-reduced pressure and temperature.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Pseudocritical Properties */}
        {matches('pseudocritical temperature pressure tpc ppc ppr tpr standing sutton') && (
          <div className="standard-card">
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
              2. Pseudocritical Temperature and Pressure
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
              Calculated from gas specific gravity to obtain dimensionless pseudo-reduced pressure Ppr and temperature Tpr.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '1.25rem' }}>
              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Methodology Linear Formulation
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="T_{pc} = 170.491 + 307.344 \gamma_g \quad [^\circ\text{R}]" />
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="P_{pc} = 709.604 - 58.718 \gamma_g \quad [\text{psia}]" />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Pseudo-Reduced Parameters
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="P_{pr} = \frac{P}{P_{pc}}, \quad T_{pr} = \frac{T}{T_{pc}}" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Gas Formation Volume Factor */}
        {matches('formation volume factor bg bgi cuft scf bbl') && (
          <div className="standard-card">
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
              3. Gas Formation Volume Factor (Bg)
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
              Relates the reservoir volume of gas to its surface volume at standard conditions (14.7 psia and 60 deg F).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '1.25rem' }}>
              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Cubic Feet per Standard Cubic Foot
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="B_{gi} = 0.02827 \times \frac{Z \times T}{P} \quad \left[\frac{\text{cuft}}{\text{scf}}\right]" />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Reservoir Barrels per Standard Cubic Foot
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="B_g = 0.005035 \, \frac{z \, T}{p} \quad \left[\frac{\text{bbl}}{\text{scf}}\right]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Volumetric Method */}
        {matches('volumetric original gas in place giip recovery factor ultimate recovery') && (
          <div className="standard-card">
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
              4. Volumetric Method
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
              Calculates original gas in place from reservoir pore volume and petrophysical rock properties.
            </p>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Initial Gas in Place (Gi)
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="G_i = \frac{43560 \, A \, h \, \phi (1 - S_{wi})}{B_{gi}} \quad [\text{scf}]" />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                Where A is drainage area in acres, h is net pay in feet, phi is porosity as a fraction, Swi is initial water saturation, and Bgi is in ft3/scf.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '1.25rem' }}>
              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Ultimate Recovery (UR)
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="UR = 43560 \, A \, h \, \phi (1 - S_{wi}) \left(\frac{1}{B_{gi}} - \frac{1}{B_{ga}}\right)" />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Recovery Factor (RF)
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="RF = 1 - \frac{B_{gi}}{B_{ga}}" />
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0' }}>
                  Where Bga is the gas formation volume factor at abandonment pressure.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 5: Material Balance Method */}
        {matches('material balance havlena odeh p/z volumetric water drive') && (
          <div className="standard-card">
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
              5. Material Balance Method
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
              General Havlena-Odeh material balance formulation for non-associated gas reservoirs.
            </p>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                General Material Balance Equation
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex
                  block
                  math="G (B_g - B_{gi}) + G B_{gi} \left(\frac{c_f + c_w S_{wi}}{1 - S_{wi}}\right) \Delta P + W_e = G_p B_g + W_p B_w"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '1.25rem' }}>
              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Volumetric Gas Reservoir
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="G = \frac{G_p B_g}{B_g - B_{gi}}, \quad \frac{p}{z} = \frac{p_i}{z_i} \left(1 - \frac{G_p}{G}\right)" />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Water Drive Gas Reservoir
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="G = \frac{B_g G_p}{B_g - B_{gi}} - \frac{W_e - B_w W_p}{B_g - B_{gi}}" />
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="\frac{p}{z} = \frac{p_i}{z_i} - \frac{p_i}{z_i G} \left(G_p - \frac{W_e - B_w W_p}{B_g}\right)" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 6: Water Influx Theory (Pot and Schilthuis Models) */}
        {matches('water influx pot aquifer schilthuis steady state encroachment') && (
          <div className="standard-card">
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
              6. Water Influx Theory: Pot Aquifer and Schilthuis Models
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
              Aquifer water encroachment modeling using the Pot Aquifer compressibility model and the Schilthuis steady-state influx equation.
            </p>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Pot Aquifer Equation
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="W_e = (c_w + c_f) \cdot W_i \cdot f \cdot (P_i - P)" />
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="W_i = \frac{\pi (r_a^2 - r_e^2) h \phi}{5.615}, \quad f = \frac{\theta}{360}, \quad c_t = c_w + c_f" />
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Schilthuis Steady-State Aquifer Model
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="\Delta W_e = C \cdot \left(P_i - \bar{P}\right) \cdot \Delta t, \quad W_e = \sum \Delta W_e" />
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="C = \frac{0.00708 \, k \, h \, f}{\mu_w \ln(r_a / r_e)} \quad \left[\frac{\text{bbl}}{\text{day} \cdot \text{psi}}\right]" />
              </div>
            </div>
          </div>
        )}

        {/* Section 7: Reservoir Drive Indices */}
        {matches('drive indices gdi wdi cdi idd iwd icd compaction depletion water') && (
          <div className="standard-card">
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
              7. Reservoir Drive Indices
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
              Relative fractional energy contribution of gas expansion, rock/connate compaction, and water drive to reservoir depletion.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Gas Expansion Index (GDI and IDD)
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="GDI = \frac{G E_g}{F^*}" />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Water Drive Index (WDI and IWD)
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="WDI = \frac{W_e - B_w W_p}{F^*}" />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Compaction Drive Index (CDI and ICD)
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="CDI = \frac{G E_{fw}}{F^*}" />
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                <Latex math="GDI + CDI + WDI = 1.0" />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0' }}>
                Because there is no black-oil phase expansion, the oil depletion index ODI is zero.
              </p>
            </div>
          </div>
        )}

        {/* Section 8: Arps Decline Curve Analysis */}
        {matches('arps decline curve hyperbolic exponential harmonic economic limit switch time') && (
          <div className="standard-card">
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
              8. Arps Production Decline Curve Analysis
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
              Rate-time and cumulative production formulations fitted to production history and extrapolated to economic abandonment.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Hyperbolic Decline (0 &lt; b &lt; 1)
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="q(t) = \frac{q_i}{(1 + b D_i t)^{1/b}}" />
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="G_p = \frac{q_i^b}{(1 - b) D_i} \left(q_i^{1-b} - q^{1-b}\right)" />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Exponential Decline (b = 0)
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="q(t) = q_i e^{-D_i t}" />
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="G_p = \frac{q_i - q}{D_i}" />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Harmonic Decline (b = 1)
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="q(t) = \frac{q_i}{1 + D_i t}" />
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="G_p = \frac{q_i}{D_i} \ln\left(\frac{q_i}{q}\right)" />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Nominal and Effective Decline Rates
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="D = -\frac{1}{q}\frac{dq}{dt} = D_i \left(\frac{q}{q_i}\right)^b" />
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="D_e = 1 - e^{-D_i} \quad (\text{exp.}), \quad D_e = 1 - (1 + b D_i)^{-1/b} \quad (\text{hyp.})" />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Economic Limit Time (ta)
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="t_a = \frac{(q_i / q_a)^b - 1}{b D_i} \quad (\text{hyperbolic})" />
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="t_a = \frac{\ln(q_i / q_a)}{D_i} \quad (\text{exp.}), \quad t_a = \frac{q_i / q_a - 1}{D_i} \quad (\text{harm.})" />
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Remaining Reserves and Switch Time
              </div>
              <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                <Latex block math="R_g = G_p(q_a) - G_p(q_{now}), \quad t_{sw} = \frac{D_i / D_{lim} - 1}{b D_i}" />
              </div>
            </div>
          </div>
        )}

        {/* Section 9: Reserves-Coupled Production Forecast */}
        {matches('forecast depletion years ultimate recovery eur timeline') && (
          <div className="standard-card">
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>
              9. Reserves-Coupled Production Forecast and Depletion Time
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
              Couples the estimated recoverable gas volume (EUR) with initial field rate and economic abandonment limit to compute the years required to deplete the reservoir.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '1.25rem' }}>
              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Volume-Matched Decline Rate (1/day)
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="D_{res} = \frac{q_i^b \left(q_i^{1-b} - q_a^{1-b}\right)}{(1 - b) \, V_{rec}} \quad (\text{hyp.}), \quad V_{rec} = 10^6 \, EUR_{\text{Bscf}}" />
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="D_{res} = \frac{q_i - q_a}{V_{rec}} \quad (\text{exp.}), \quad D_{res} = \frac{q_i \ln(q_i / q_a)}{V_{rec}} \quad (\text{harm.})" />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-element)', padding: '1.25rem', borderRadius: '10px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Years to Deplete (tdeplete)
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="t_{\text{deplete}} = \frac{(q_i / q_a)^b - 1}{365.25 \, b \, D_{res}} \quad [\text{years, hyp.}]" />
                </div>
                <div style={{ overflowX: 'auto', padding: '0.35rem 0' }}>
                  <Latex block math="t_{\text{deplete}} = \frac{\ln(q_i / q_a)}{365.25 \, D_{res}} \quad (\text{exp.}), \quad t_{\text{deplete}} = \frac{q_i / q_a - 1}{365.25 \, D_{res}} \quad (\text{harm.})" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
