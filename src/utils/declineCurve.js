// Sections 3.8 & 3.9: Arps Decline Curve Analysis, Calculated Economic Limit (qa), and Reserves-Coupled Forecast

function resolveActiveB(declineModel, arpsExponent) {
  if (declineModel === 'exponential') return 0
  if (declineModel === 'harmonic') return 1
  const raw = Number(arpsExponent)
  return Number.isFinite(raw) && raw > 0 && raw < 1 ? Math.max(0.05, Math.min(0.95, raw)) : 0.5
}

function resolveCurveHyperbolicB(arpsExponent) {
  const raw = Number(arpsExponent)
  return Number.isFinite(raw) && raw > 0 && raw < 1 ? Math.max(0.05, Math.min(0.95, raw)) : 0.5
}

export function calcAbandonmentRatio(piPsia = 3200, paPsia = 500) {
  const pi = Number(piPsia)
  const pa = Number(paPsia)
  if (!(pi > pa && pa > 0)) return 0.06
  return Math.max(0.035, Math.min(0.35, Math.pow(pa / pi, 1.5)))
}

export function estimateEconomicLimitMscfDay({
  qi,
  DiDaily,
  declineModel = 'hyperbolic',
  b = 0.5,
  targetEurBscf = 0,
  piPsia = 3200,
  paPsia = 500,
}) {
  const qInitial = Number(qi) > 0 ? Number(qi) : 12000
  const ratioQa = qInitial * calcAbandonmentRatio(piPsia, paPsia)
  const eurMscf = Number(targetEurBscf) > 0 ? Number(targetEurBscf) * 1e6 : 0
  const dDay = Number(DiDaily) > 0 ? Number(DiDaily) : 0

  if (eurMscf > 0 && dDay > 0) {
    let qaArps = NaN
    if (declineModel === 'exponential' || b === 0) {
      qaArps = qInitial - eurMscf * dDay
    } else if (declineModel === 'harmonic' || b === 1) {
      qaArps = qInitial * Math.exp(-(eurMscf * dDay) / qInitial)
    } else {
      const term =
        Math.pow(qInitial, 1 - b) - (eurMscf * (1 - b) * dDay) / Math.pow(qInitial, b)
      if (term > 0) {
        qaArps = Math.pow(term, 1 / (1 - b))
      }
    }

    if (
      Number.isFinite(qaArps) &&
      qaArps >= Math.max(25, qInitial * 0.03) &&
      qaArps <= qInitial * 0.45
    ) {
      return Math.max(10, qaArps)
    }
  }

  return Math.max(10, Math.min(qInitial * 0.5, ratioQa))
}

function solvePressureFromPz({
  piPsia = 3200,
  paPsia = 500,
  ziFactor = 0.85,
  zaFactor = 0.96,
  depletionFraction = 0,
  hasWaterDrive = false,
}) {
  const pi = Number(piPsia) > 0 ? Number(piPsia) : 3200
  const pa = Number(paPsia) > 0 && Number(paPsia) < pi ? Number(paPsia) : pi * 0.15
  const zi = Number(ziFactor) > 0 ? Number(ziFactor) : 0.85
  const za = Number(zaFactor) > 0 ? Number(zaFactor) : 0.96

  const f = Math.max(0, Math.min(1, depletionFraction))
  // Water-drive aquifer influx sustains reservoir pressure higher during early recovery
  const pzDropFraction = hasWaterDrive ? Math.pow(f, 1.35) : f
  const pzInit = pi / zi
  const pzAband = pa / za
  const pzTarget = pzInit - pzDropFraction * (pzInit - pzAband)

  const slopeZ = (zi - za) / (pi - pa)
  const denom = 1 - pzTarget * slopeZ
  if (Math.abs(denom) > 1e-6) {
    const solved = (pzTarget * (za - slopeZ * pa)) / denom
    if (Number.isFinite(solved)) {
      return Math.max(pa, Math.min(pi, solved))
    }
  }

  return Math.max(pa, Math.min(pi, pi - pzDropFraction * (pi - pa)))
}

export function calcArpsDecline({
  initialRateMscfDay = 12000,
  nominalDeclineMonthly = 0.025,
  arpsExponent = 0.5,
  targetEurBscf = 0,
  piPsia = 3200,
  paPsia = 500,
  forecastMonths = 0,
  activeModel = 'hyperbolic',
}) {
  const qi = Number(initialRateMscfDay) > 0 ? Number(initialRateMscfDay) : 12000
  const Di = Number(nominalDeclineMonthly) > 0 ? Number(nominalDeclineMonthly) : 0.025
  const daysPerMonth = 30.4375
  const DiDaily = Di / daysPerMonth

  const activeB = resolveActiveB(activeModel, arpsExponent)
  const curveB = resolveCurveHyperbolicB(arpsExponent)

  const qa = estimateEconomicLimitMscfDay({
    qi,
    DiDaily,
    declineModel: activeModel,
    b: activeB,
    targetEurBscf,
    piPsia,
    paPsia,
  })

  // Nominal-to-effective monthly decline rates per Chapter 3 Eq. (3.78)-(3.80)
  const effectiveMonthlyExp = 1 - Math.exp(-Di)
  const effectiveMonthlyHyp = 1 - Math.pow(1 + curveB * Di, -1 / curveB)
  const effectiveMonthlyHarm = Di / (1 + Di)

  // Economic limit times (months and years) per Chapter 3 Eq. (3.75)-(3.77)
  const taExponentialMonths = qi > qa ? Math.log(qi / qa) / Di : 0
  const taHyperbolicMonths = qi > qa ? (Math.pow(qi / qa, curveB) - 1) / (curveB * Di) : 0
  const taHarmonicMonths = qi > qa ? (qi / qa - 1) / Di : 0

  const taExponentialYears = taExponentialMonths / 12
  const taHyperbolicYears = taHyperbolicMonths / 12
  const taHarmonicYears = taHarmonicMonths / 12

  // Equations (3.72)-(3.74): EUR at calculated economic limit qa
  const eurExpMscf = qi > qa ? ((qi - qa) / Di) * daysPerMonth : 0
  const eurHypMscf =
    qi > qa
      ? ((Math.pow(qi, curveB) / ((1 - curveB) * Di)) *
          (Math.pow(qi, 1 - curveB) - Math.pow(qa, 1 - curveB))) *
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

  // Build decline forecast series up to 105% of active model's economic limit time
  const defaultHorizonMonths = Math.min(600, Math.max(36, Math.ceil(activeTaMonths || 36)))
  const horizonMonths = Number(forecastMonths) > 0 ? Number(forecastMonths) : defaultHorizonMonths
  const totalPoints = 48
  const stepMonths = Math.max(1, Math.ceil(horizonMonths / totalPoints))
  const dcaCurve = []

  for (let m = 0; m <= horizonMonths; m += stepMonths) {
    const qExp = qi * Math.exp(-Di * m)
    const qHyp = qi / Math.pow(1 + curveB * Di * m, 1 / curveB)
    const qHarm = qi / (1 + Di * m)

    let activeRate = qHyp
    if (activeModel === 'exponential') activeRate = qExp
    else if (activeModel === 'harmonic') activeRate = qHarm

    dcaCurve.push({
      month: m,
      year: Number((m / 12).toFixed(1)),
      exponentialRate: Math.round(qExp),
      hyperbolicRate: Math.round(qHyp),
      harmonicRate: Math.round(qHarm),
      activeRate: Math.round(activeRate),
      economicLimit: Math.round(qa),
    })

    if (qExp < qa && qHyp < qa && qHarm < qa && m > 24) {
      break
    }
  }

  return {
    bExponent: activeB,
    estimatedEconomicLimitMscfDay: Math.round(qa),
    effectiveMonthlyExp,
    effectiveMonthlyHyp,
    effectiveMonthlyHarm,
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
    dcaCurve,
  }
}

function getArpsDepletionShapeFactor(declineModel, activeB, ratio) {
  const r = Math.max(0.01, Math.min(0.95, ratio))
  if (declineModel === 'exponential' || activeB === 0) {
    return Math.log(1 / r) / (1 - r)
  }
  if (declineModel === 'harmonic' || activeB === 1) {
    return (1 / r - 1) / Math.log(1 / r)
  }
  const b = activeB
  return ((1 - b) * (Math.pow(r, -b) - 1)) / (b * (1 - Math.pow(r, 1 - b)))
}

// Reserves-coupled gas production forecast with optional target depletion horizon X (years) and pressure trajectory
export function calcProductionForecast({
  estimatedRecoverableBscf,
  giipBscf = 0,
  usingProvidedForecastGiip = false,
  initialRateMscfDay = 12000,
  targetDepletionYears = 0,
  nominalDeclineMonthly = 0.025,
  arpsExponent = 0.5,
  declineModel = 'hyperbolic',
  piPsia = 3200,
  paPsia = 500,
  ziFactor = 0.85,
  zaFactor = 0.96,
  hasWaterDrive = false,
}) {
  const eurBscf = Number(estimatedRecoverableBscf) > 0 ? Number(estimatedRecoverableBscf) : 0
  const giip = Number(giipBscf) > 0 ? Number(giipBscf) : eurBscf
  const activeB = resolveActiveB(declineModel, arpsExponent)
  const DiMonth = Number(nominalDeclineMonthly) > 0 ? Number(nominalDeclineMonthly) : 0.025
  const daysPerYear = 365.25
  const daysPerMonth = 30.4375
  const DiDaily = DiMonth / daysPerMonth

  const targetYears = Number(targetDepletionYears) > 0 ? Number(targetDepletionYears) : 0
  const rAband = calcAbandonmentRatio(piPsia, paPsia)

  let qi = Number(initialRateMscfDay) > 0 ? Number(initialRateMscfDay) : 0
  let qa = 0
  let targetDepletionApplied = false

  if (eurBscf > 0 && targetYears > 0) {
    const vRecMscf = eurBscf * 1e6
    const shapeFactor = getArpsDepletionShapeFactor(declineModel, activeB, rAband)
    qi = (vRecMscf / (daysPerYear * targetYears)) * shapeFactor
    qa = Math.max(10, qi * rAband)
    targetDepletionApplied = true
  } else if (eurBscf > 0 && qi > 0) {
    qa = estimateEconomicLimitMscfDay({
      qi,
      DiDaily,
      declineModel,
      b: activeB,
      targetEurBscf: eurBscf,
      piPsia,
      paPsia,
    })
  }

  if (eurBscf <= 0 || qi <= 0) {
    return {
      canProduce: false,
      eurBscf: 0,
      giipBscf: Number(giip.toFixed(2)),
      usingProvidedForecastGiip,
      qiMscfDay: Math.round(qi),
      qaMscfDay: Math.round(qa),
      averageRateMscfDay: 0,
      targetDepletionApplied: false,
      bExponent: activeB,
      yearsToDeplete: 0,
      monthsToDeplete: 0,
      constantRateYears: 0,
      impliedMonthlyDeclinePct: 0,
      impliedAnnualDeclinePct: 0,
      yearlySchedule: [],
      forecastCurve: [],
    }
  }

  const vRecMscf = eurBscf * 1e6
  let declinePerDay = 0
  let totalDays = 0

  if (declineModel === 'exponential' || activeB === 0) {
    declinePerDay = (qi - qa) / vRecMscf
    totalDays = declinePerDay > 0 ? Math.log(qi / qa) / declinePerDay : vRecMscf / qi
  } else if (declineModel === 'harmonic' || activeB === 1) {
    declinePerDay = (qi * Math.log(qi / qa)) / vRecMscf
    totalDays = declinePerDay > 0 ? (qi / qa - 1) / declinePerDay : vRecMscf / qi
  } else {
    declinePerDay =
      (Math.pow(qi, activeB) * (Math.pow(qi, 1 - activeB) - Math.pow(qa, 1 - activeB))) /
      ((1 - activeB) * vRecMscf)
    totalDays =
      declinePerDay > 0 ? (Math.pow(qi / qa, activeB) - 1) / (activeB * declinePerDay) : vRecMscf / qi
  }

  const yearsToDeplete = totalDays / daysPerYear
  const monthsToDeplete = totalDays / daysPerMonth
  const constantRateYears = vRecMscf / (qi * daysPerYear)
  const impliedMonthlyDeclinePct = declinePerDay * daysPerMonth * 100
  const impliedAnnualDeclinePct = declinePerDay * daysPerYear * 100
  const averageRateMscfDay = totalDays > 0 ? vRecMscf / totalDays : qi

  const evalAtDay = (day) => {
    const d = Math.max(0, Math.min(day, totalDays))
    let q = qi
    let gpMscf = 0

    if (declineModel === 'exponential' || activeB === 0) {
      q = declinePerDay > 0 ? qi * Math.exp(-declinePerDay * d) : qi
      gpMscf = declinePerDay > 0 ? (qi - q) / declinePerDay : qi * d
    } else if (declineModel === 'harmonic' || activeB === 1) {
      q = declinePerDay > 0 ? qi / (1 + declinePerDay * d) : qi
      gpMscf = declinePerDay > 0 ? (qi / declinePerDay) * Math.log(qi / q) : qi * d
    } else {
      q = declinePerDay > 0 ? qi / Math.pow(1 + activeB * declinePerDay * d, 1 / activeB) : qi
      gpMscf =
        declinePerDay > 0
          ? (Math.pow(qi, activeB) / ((1 - activeB) * declinePerDay)) *
            (Math.pow(qi, 1 - activeB) - Math.pow(q, 1 - activeB))
          : qi * d
    }

    const cumulativeBscf = Math.min(eurBscf, gpMscf / 1e6)
    const remainingBscf = Math.max(0, eurBscf - cumulativeBscf)
    const depletionFraction = eurBscf > 0 ? cumulativeBscf / eurBscf : 0
    const pressurePsia = solvePressureFromPz({
      piPsia,
      paPsia,
      ziFactor,
      zaFactor,
      depletionFraction,
      hasWaterDrive,
    })

    return {
      q,
      cumulativeBscf,
      remainingBscf,
      pressurePsia,
    }
  }

  const chartSteps = 48
  const forecastCurve = []
  for (let i = 0; i <= chartSteps; i += 1) {
    const yearVal = (yearsToDeplete * i) / chartSteps
    const { q, cumulativeBscf, remainingBscf, pressurePsia } = evalAtDay(yearVal * daysPerYear)
    forecastCurve.push({
      year: Number(yearVal.toFixed(1)),
      rateMscfDay: Math.round(q),
      rateMmscfDay: Number((q / 1000).toFixed(2)),
      pressurePsia: Number(pressurePsia.toFixed(0)),
      cumulativeBscf: Number(cumulativeBscf.toFixed(2)),
      remainingBscf: Number(remainingBscf.toFixed(2)),
      giipBscf: Number(giip.toFixed(2)),
      economicLimit: Math.round(qa),
    })
  }

  const wholeYears = Math.floor(yearsToDeplete)
  const yearStep = wholeYears > 40 ? Math.ceil(wholeYears / 40) : 1
  const yearlySchedule = []
  let prevCum = 0

  for (let yr = yearStep; yr <= wholeYears; yr += yearStep) {
    const { q, cumulativeBscf, remainingBscf, pressurePsia } = evalAtDay(yr * daysPerYear)
    const periodProd = Math.max(0, cumulativeBscf - prevCum)
    prevCum = cumulativeBscf
    yearlySchedule.push({
      year: yr,
      yearLabel: `Year ${yr}`,
      rateMscfDay: Math.round(q),
      rateMmscfDay: Number((q / 1000).toFixed(2)),
      pressurePsia: Number(pressurePsia.toFixed(0)),
      periodProductionBscf: Number(periodProd.toFixed(2)),
      cumulativeProductionBscf: Number(cumulativeBscf.toFixed(2)),
      remainingReservesBscf: Number(remainingBscf.toFixed(2)),
      recoveryPct: Number(((cumulativeBscf / eurBscf) * 100).toFixed(1)),
    })
  }

  if (yearsToDeplete > wholeYears || yearlySchedule.length === 0) {
    const finalYearRounded = Number(yearsToDeplete.toFixed(1))
    const { q, cumulativeBscf, remainingBscf, pressurePsia } = evalAtDay(totalDays)
    const periodProd = Math.max(0, cumulativeBscf - prevCum)
    yearlySchedule.push({
      year: finalYearRounded,
      yearLabel: `Year ${finalYearRounded}`,
      rateMscfDay: Math.round(q),
      rateMmscfDay: Number((q / 1000).toFixed(2)),
      pressurePsia: Number(pressurePsia.toFixed(0)),
      periodProductionBscf: Number(periodProd.toFixed(2)),
      cumulativeProductionBscf: Number(cumulativeBscf.toFixed(2)),
      remainingReservesBscf: Number(remainingBscf.toFixed(2)),
      recoveryPct: Number(((cumulativeBscf / eurBscf) * 100).toFixed(1)),
    })
  }

  return {
    canProduce: true,
    eurBscf: Number(eurBscf.toFixed(2)),
    giipBscf: Number(giip.toFixed(2)),
    usingProvidedForecastGiip,
    qiMscfDay: Math.round(qi),
    qaMscfDay: Math.round(qa),
    averageRateMscfDay: Math.round(averageRateMscfDay),
    targetDepletionApplied,
    bExponent: activeB,
    yearsToDeplete: Number(yearsToDeplete.toFixed(2)),
    monthsToDeplete: Number(monthsToDeplete.toFixed(1)),
    constantRateYears: Number(constantRateYears.toFixed(2)),
    impliedMonthlyDeclinePct: Number(impliedMonthlyDeclinePct.toFixed(2)),
    impliedAnnualDeclinePct: Number(impliedAnnualDeclinePct.toFixed(2)),
    yearlySchedule,
    forecastCurve,
  }
}
