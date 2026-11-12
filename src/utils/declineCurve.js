// Section 3.8: Arps Decline Curve Analysis (DCA) Module

export function calcArpsDecline({
  initialRateMscfDay = 12000,
  nominalDeclinePerMonth = 0.025,
  hyperbolicExponentB = 0.5,
  economicLimitMscfDay = 500,
  limitingDeclinePerMonth = 0.006,
  forecastMonths = 36,
}) {
  const qi = Number(initialRateMscfDay) > 0 ? Number(initialRateMscfDay) : 12000
  const Di = Number(nominalDeclinePerMonth) > 0 ? Number(nominalDeclinePerMonth) : 0.025
  const b = Math.max(0.05, Math.min(0.95, Number(hyperbolicExponentB) ? Number(hyperbolicExponentB) : 0.5))
  const qa = Number(economicLimitMscfDay) > 0 ? Number(economicLimitMscfDay) : 500
  const Dlim = Number(limitingDeclinePerMonth) > 0 ? Number(limitingDeclinePerMonth) : 0.006
  const months = Number(forecastMonths) > 0 ? Number(forecastMonths) : 36

  // Equations (3.75) & (3.76): Effective monthly decline rates De
  const effectiveDeclineExp = 1 - Math.exp(-Di)
  const effectiveDeclineHyp = 1 - Math.pow(1 + b * Di, -1 / b)

  // Equations (3.77) to (3.79): Time to reach economic limit ta (months)
  const taExponentialMonths = qi > qa ? Math.log(qi / qa) / Di : 0
  const taHyperbolicMonths = qi > qa ? (Math.pow(qi / qa, b) - 1) / (b * Di) : 0
  const taHarmonicMonths = qi > qa ? (qi / qa - 1) / Di : 0

  // Equations (3.72) to (3.74): EUR at economic limit qa (converted from Mscf/day * 30.4375 days/month to Bscf)
  const daysPerMonth = 30.4375
  const eurExpMscf = qi > qa ? ((qi - qa) / Di) * daysPerMonth : 0
  const eurHypMscf =
    qi > qa
      ? ((Math.pow(qi, b) / ((1 - b) * Di)) *
          (Math.pow(qi, 1 - b) - Math.pow(qa, 1 - b))) *
        daysPerMonth
      : 0
  const eurHarmMscf = qi > qa ? ((qi / Di) * Math.log(qi / qa)) * daysPerMonth : 0

  // Equation (3.81): Switch time from hyperbolic to exponential when D falls to Dlim
  const tSwitchMonths = Di > Dlim ? (Di / Dlim - 1) / (b * Di) : months

  // Generate monthly rate and cumulative curves for all three Arps models
  const dcaCurve = []
  for (let t = 0; t <= months; t++) {
    // Equation (3.67): Exponential (b = 0)
    const qExp = qi * Math.exp(-Di * t)
    // Equation (3.66): Hyperbolic (0 < b < 1)
    const qHyp = qi / Math.pow(1 + b * Di * t, 1 / b)
    // Equation (3.68): Harmonic (b = 1)
    const qHarm = qi / (1 + Di * t)

    dcaCurve.push({
      month: t,
      exponentialRate: Math.round(qExp),
      hyperbolicRate: Math.round(qHyp),
      harmonicRate: Math.round(qHarm),
      economicLimit: Math.round(qa),
    })
  }

  return {
    effectiveDeclineExp,
    effectiveDeclineHyp,
    taExponentialMonths,
    taHyperbolicMonths,
    taHarmonicMonths,
    eurExponentialBscf: eurExpMscf / 1e6,
    eurHyperbolicBscf: eurHypMscf / 1e6,
    eurHarmonicBscf: eurHarmMscf / 1e6,
    tSwitchMonths,
    dcaCurve,
  }
}

