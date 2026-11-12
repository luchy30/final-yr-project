// Section 3.4: Volumetric Reserves Estimation Module

export function calcVolumetricReserves({
  areaAcres,
  netPayFeet,
  porosity,
  initialWaterSat,
  residualGasSat,
  initialPressurePsia,
  initialZ,
  bgiCuftScf,
  abandonmentPressurePsia,
  abandonmentZ,
  bgaCuftScf,
  cumulativeGasProducedBscf = 0,
  driveMechanism = 'volumetric',
}) {
  const A = Number(areaAcres) > 0 ? Number(areaAcres) : 0
  const h = Number(netPayFeet) > 0 ? Number(netPayFeet) : 0
  const phi = Number(porosity) > 0 ? Number(porosity) : 0
  const swi = Number(initialWaterSat) >= 0 ? Number(initialWaterSat) : 0
  const sgr = Number(residualGasSat) >= 0 ? Number(residualGasSat) : 0.25
  const pi = Number(initialPressurePsia) > 0 ? Number(initialPressurePsia) : 3000
  const zi = Number(initialZ) > 0 ? Number(initialZ) : 0.85
  const bgi = Number(bgiCuftScf) > 0 ? Number(bgiCuftScf) : 0.005
  const pa = Number(abandonmentPressurePsia) > 0 ? Number(abandonmentPressurePsia) : 500
  const za = Number(abandonmentZ) > 0 ? Number(abandonmentZ) : 0.92
  const bga = Number(bgaCuftScf) > 0 ? Number(bgaCuftScf) : 0.03
  const gpCurrentBscf = Number(cumulativeGasProducedBscf) >= 0 ? Number(cumulativeGasProducedBscf) : 0

  // Equation (3.11): Original gas in place G in scf and Bscf
  const poreVolumeCuft = 43560 * A * h * phi * (1 - swi)
  const giipScf = bgi > 0 ? poreVolumeCuft / bgi : 0
  const giipBscf = giipScf / 1e9

  // Equation in Section 3.2.1: Gas produced to abandonment under expansion
  const gasProducedToAbandonmentScf =
    bgi > 0 && bga > 0 ? poreVolumeCuft * (1 / bgi - 1 / bga) : 0
  const gasProducedToAbandonmentBscf = Math.max(0, gasProducedToAbandonmentScf / 1e9)

  // Equation (3.12): Recovery factor for volumetric depletion reservoir
  const piOverZi = zi > 0 ? pi / zi : 0
  const paOverZa = za > 0 ? pa / za : 0
  const rfVolumetric =
    piOverZi > 0 ? Math.max(0, Math.min(0.95, 1 - paOverZa / piOverZi)) : 0.75

  // Equation (3.13): Recovery factor for complete water-drive reservoir
  const rfWaterDrive =
    1 - swi > 0 && bga > 0
      ? Math.max(0, Math.min(0.9, 1 - (sgr / (1 - swi)) * (bgi / bga)))
      : 0.55

  const activeRf = driveMechanism === 'water_drive' ? rfWaterDrive : rfVolumetric

  // Ultimate recovery and Equation (3.14) Remaining reserves Rg = RF * G - Gp
  const ultimateRecoveryBscf = activeRf * giipBscf
  const remainingReservesBscf = Math.max(0, ultimateRecoveryBscf - gpCurrentBscf)

  return {
    giipScf,
    giipBscf,
    rfVolumetric,
    rfWaterDrive,
    activeRf,
    ultimateRecoveryBscf,
    remainingReservesBscf,
    gasProducedToAbandonmentBscf,
    piOverZi,
    paOverZa,
  }
}

