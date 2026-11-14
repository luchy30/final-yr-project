// Section 3.8: Arps Decline Curve Analysis (DCA) and Reserves-Coupled Production Forecast

export function calcArpsDecline({
  initialRateMscfDay = 12000,
  nominalDeclinePerMonth = 0.025,
  hyperbolicExponentB = 0.5,
  economicLimitMscfDay = 500,
  limitingDeclinePerMonth = 0.006,
  forecastMonths = 0,
  activeModel = 'hyperbolic',
}) {
  const qi = Number(initialRateMscfDay) > 0 ? Number(initialRateMscfDay) : 12000
  const Di = Number(nominalDeclinePerMonth) > 0 ? Number(nominalDeclinePerMonth) : 0.025
  const rawB = Number(hyperbolicExponentB)
  const b = Number.isFinite(rawB) && rawB > 0 ? Math.max(0.05, Math.min(0.95, rawB)) : 0.5
  const qa = Number(economicLimitMscfDay) > 0 ? Number(economicLimitMscfDay) : 500
  const Dlim = Number(limitingDeclinePerMonth) > 0 ? Number(limitingDeclinePerMonth) : 0.006

  // Equations (3.75) & (3.76): Effective monthly decline rates De
  const effectiveDeclineExp = 1 - Math.exp(-Di)
  const effectiveDeclineHyp = 1 - Math.pow(1 + b * Di, -1 / b)

  // Equations (3.77) to (3.79): Time to reach economic limit ta (months and years)
  const taExponentialMonths = qi > qa ? Math.log(qi / qa) / Di : 0
  const taHyperbolicMonths = qi > qa ? (Math.pow(qi / qa, b) - 1) / (b * Di) : 0
  const taHarmonicMonths = qi > qa ? (qi / qa - 1) / Di : 0

  const taExponentialYears = taExponentialMonths / 12
  const taHyperbolicYears = taHyperbolicMonths / 12
  const taHarmonicYears = taHarmonicMonths / 12

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

  const eurExponentialBscf = eurExpMscf / 1e6
  const eurHyperbolicBscf = eurHypMscf / 1e6
  const eurHarmonicBscf = eurHarmMscf / 1e6

  let activeTaMonths = taHyperbolicMonths
  let activeEurBscf = eurHyperbolicBscf
  if (activeModel === 'exponential') {
    activeTaMonths = taExponentialMonths
    activeEurBscf = eurExponentialBscf
  } else if (activeModel === 'harmonic') {
    activeTaMonths = taHarmonicMonths
    activeEurBscf = eurHarmonicBscf
  }
  const activeTaYears = activeTaMonths / 12

  // Horizon covers depletion of the active model (capped cleanly at 50 years = 600 months)
  const defaultHorizonMonths = Math.min(600, Math.max(36, Math.ceil(activeTaMonths || 36)))
  const horizonMonths = Number(forecastMonths) > 0 ? Number(forecastMonths) : defaultHorizonMonths

  // Equation (3.81): Switch time from hyperbolic to exponential when D falls to Dlim
  const tSwitchMonths = Di > Dlim ? (Di / Dlim - 1) / (b * Di) : horizonMonths

  // Generate curve points across years up to horizonMonths
  const totalPoints = 48
  const stepMonths = Math.max(1, Math.ceil(horizonMonths / totalPoints))
  const dcaCurve = []

  const pushPoint = (t) => {
    const qExp = qi * Math.exp(-Di * t)
    const qHyp = qi / Math.pow(1 + b * Di * t, 1 / b)
    const qHarm = qi / (1 + Di * t)

    let activeRate = qHyp
    if (activeModel === 'exponential') activeRate = qExp
    else if (activeModel === 'harmonic') activeRate = qHarm

    dcaCurve.push({
      month: Number(t.toFixed(1)),
      year: Number((t / 12).toFixed(2)),
      exponentialRate: Math.round(qExp),
      hyperbolicRate: Math.round(qHyp),
      harmonicRate: Math.round(qHarm),
      activeRate: Math.round(activeRate),
      economicLimit: Math.round(qa),
    })
  }

  for (let t = 0; t < horizonMonths; t += stepMonths) {
    pushPoint(t)
  }
  pushPoint(horizonMonths)

  return {
    effectiveDeclineExp,
    effectiveDeclineHyp,
    taExponentialMonths,
    taHyperbolicMonths,
    taHarmonicMonths,
    taExponentialYears,
    taHyperbolicYears,
    taHarmonicYears,
    activeTaMonths,
    activeTaYears,
    eurExponentialBscf,
    eurHyperbolicBscf,
    eurHarmonicBscf,
    activeEurBscf,
    tSwitchMonths,
    horizonMonths,
    dcaCurve,
  }
}

// Reserves-coupled gas production forecast and depletion duration in years
export function calcProductionForecast({
  estimatedRecoverableBscf = 0,
  giipBscf = 0,
  initialRateMscfDay = 12000,
  economicLimitMscfDay = 500,
  hyperbolicExponentB = 0.5,
  declineModel = 'hyperbolic',
}) {
  const eurBscf = Number(estimatedRecoverableBscf) > 0 ? Number(estimatedRecoverableBscf) : 0
  const giip = Number(giipBscf) > 0 ? Number(giipBscf) : eurBscf
  const qi = Number(initialRateMscfDay) > 0 ? Number(initialRateMscfDay) : 12000
  const qaRaw = Number(economicLimitMscfDay) > 0 ? Number(economicLimitMscfDay) : 500
  const qa = qi > qaRaw ? qaRaw : Math.max(10, qi * 0.1)
  const rawB = Number(hyperbolicExponentB)
  const b = Number.isFinite(rawB) && rawB > 0 ? Math.max(0.05, Math.min(0.95, rawB)) : 0.5

  if (eurBscf <= 0 || qi <= 0) {
    return {
      canProduce: false,
      eurBscf: 0,
      giipBscf: giip,
      qiMscfDay: qi,
      qaMscfDay: qa,
      yearsToDeplete: 0,
      monthsToDeplete: 0,
      constantRateYears: 0,
      impliedDeclinePerMonth: 0,
      impliedAnnualDeclinePct: 0,
      forecastCurve: [],
      yearlySchedule: [],
    }
  }

  const daysPerYear = 365.25
  const daysPerMonth = 30.4375
  const vRecMscf = eurBscf * 1e6

  let declinePerDay = 0
  let totalDays = 0

  if (declineModel === 'exponential') {
    declinePerDay = (qi - qa) / vRecMscf
    totalDays = declinePerDay > 0 ? Math.log(qi / qa) / declinePerDay : vRecMscf / qi
  } else if (declineModel === 'harmonic') {
    declinePerDay = (qi * Math.log(qi / qa)) / vRecMscf
    totalDays = declinePerDay > 0 ? (qi / qa - 1) / declinePerDay : vRecMscf / qi
  } else {
    declinePerDay =
      (Math.pow(qi, b) * (Math.pow(qi, 1 - b) - Math.pow(qa, 1 - b))) / ((1 - b) * vRecMscf)
    totalDays =
      declinePerDay > 0 ? (Math.pow(qi / qa, b) - 1) / (b * declinePerDay) : vRecMscf / qi
  }

  const yearsToDeplete = totalDays / daysPerYear
  const monthsToDeplete = totalDays / daysPerMonth
  const constantRateYears = vRecMscf / (qi * daysPerYear)
  const impliedDeclinePerMonth = declinePerDay * daysPerMonth
  let impliedAnnualDeclineFraction = 0
  if (declineModel === 'exponential') {
    // Chapter 3 Eq. (3.75) evaluated over 1 year (365.25 days)
    impliedAnnualDeclineFraction = 1 - Math.exp(-declinePerDay * daysPerYear)
  } else if (declineModel === 'harmonic') {
    impliedAnnualDeclineFraction = 1 - 1 / (1 + declinePerDay * daysPerYear)
  } else {
    // Chapter 3 Eq. (3.76) evaluated over 1 year (365.25 days)
    impliedAnnualDeclineFraction = 1 - Math.pow(1 + b * declinePerDay * daysPerYear, -1 / b)
  }
  const impliedAnnualDeclinePct = impliedAnnualDeclineFraction * 100

  const evalAtDay = (day) => {
    const d = Math.max(0, Math.min(day, totalDays))
    let q = qi
    let gpMscf = 0

    if (declineModel === 'exponential') {
      q = qi * Math.exp(-declinePerDay * d)
      gpMscf = declinePerDay > 0 ? (qi - q) / declinePerDay : qi * d
    } else if (declineModel === 'harmonic') {
      q = qi / (1 + declinePerDay * d)
      gpMscf = declinePerDay > 0 ? (qi / declinePerDay) * Math.log(qi / q) : qi * d
    } else {
      q = qi / Math.pow(1 + b * declinePerDay * d, 1 / b)
      gpMscf =
        declinePerDay > 0
          ? (Math.pow(qi, b) / ((1 - b) * declinePerDay)) *
            (Math.pow(qi, 1 - b) - Math.pow(q, 1 - b))
          : qi * d
    }

    const cumulativeBscf = Math.min(eurBscf, gpMscf / 1e6)
    const remainingBscf = Math.max(0, eurBscf - cumulativeBscf)
    return { q, cumulativeBscf, remainingBscf }
  }

  // Build smooth chart curve (up to 48 points) from year 0 to yearsToDeplete
  const chartSteps = 40
  const forecastCurve = []
  for (let i = 0; i <= chartSteps; i++) {
    const yearVal = (yearsToDeplete * i) / chartSteps
    const { q, cumulativeBscf, remainingBscf } = evalAtDay(yearVal * daysPerYear)
    forecastCurve.push({
      year: Number(yearVal.toFixed(2)),
      rateMscfDay: Math.round(q),
      cumulativeBscf: Number(cumulativeBscf.toFixed(2)),
      remainingBscf: Number(remainingBscf.toFixed(2)),
      economicLimit: Math.round(qa),
    })
  }

  // Build clean year-by-year production forecast schedule (sampled if horizon exceeds 40 years)
  const wholeYears = Math.floor(yearsToDeplete)
  const yearStep = wholeYears > 40 ? Math.ceil(wholeYears / 25) : 1
  const yearlySchedule = []
  let prevCum = 0

  for (let yr = yearStep; yr <= wholeYears; yr += yearStep) {
    const { q, cumulativeBscf, remainingBscf } = evalAtDay(yr * daysPerYear)
    yearlySchedule.push({
      yearLabel: `Year ${yr}`,
      year: yr,
      rateMscfDay: Math.round(q),
      periodProductionBscf: Number(Math.max(0, cumulativeBscf - prevCum).toFixed(2)),
      cumulativeProductionBscf: Number(cumulativeBscf.toFixed(2)),
      remainingReservesBscf: Number(remainingBscf.toFixed(2)),
      recoveryPct: Number(((cumulativeBscf / eurBscf) * 100).toFixed(1)),
    })
    prevCum = cumulativeBscf
  }

  // Always add final exact depletion milestone if not already landed on whole year
  if (yearsToDeplete > wholeYears || yearlySchedule.length === 0) {
    const finalYearRounded = Number(yearsToDeplete.toFixed(1))
    const { q, cumulativeBscf, remainingBscf } = evalAtDay(totalDays)
    yearlySchedule.push({
      yearLabel: `Year ${finalYearRounded} (Depletion)`,
      year: finalYearRounded,
      rateMscfDay: Math.round(q),
      periodProductionBscf: Number(Math.max(0, cumulativeBscf - prevCum).toFixed(2)),
      cumulativeProductionBscf: Number(cumulativeBscf.toFixed(2)),
      remainingReservesBscf: Number(remainingBscf.toFixed(2)),
      recoveryPct: Number(((cumulativeBscf / eurBscf) * 100).toFixed(1)),
    })
  }

  return {
    canProduce: true,
    eurBscf: Number(eurBscf.toFixed(2)),
    giipBscf: Number(giip.toFixed(2)),
    qiMscfDay: Math.round(qi),
    qaMscfDay: Math.round(qa),
    yearsToDeplete: Number(yearsToDeplete.toFixed(2)),
    monthsToDeplete: Number(monthsToDeplete.toFixed(1)),
    constantRateYears: Number(constantRateYears.toFixed(2)),
    impliedDeclinePerMonth,
    impliedAnnualDeclinePct: Number(impliedAnnualDeclinePct.toFixed(2)),
    forecastCurve,
    yearlySchedule,
  }
}
