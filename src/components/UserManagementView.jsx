import React, { useState } from 'react';

const DEFAULT_PERSONNEL = [
  {
    id: 'USR-001',
    name: 'Shan Reeco Socorro',
    role: 'Project Manager / Lead PE',
    organization: 'Main Contractor (Project LC1)',
    category: 'Main Contractor',
    cdePermission: 'CDE Approver (Level 4 - Final Authority)',
    statutoryReg: 'MWSHCS Certified • PM PTW Signatory',
    certExpiry: '2028-10-15',
    bizSafe: 'bizSAFE Star',
    biometricStatus: 'Active (Gate A & B)',
    ptwAuthority: ['Approve High-Risk PTW', 'Close RFI', 'Certify SOPA Claim'],
  },
  {
    id: 'USR-002',
    name: 'Er. Tan Wei Ming',
    role: 'Resident Engineer (RE - C&S)',
    organization: 'QP(S) Consultant Team',
    category: 'Consultant / RE / RTO',
    cdePermission: 'Statutory Reviewer (Level 3 - Hold Point Sign-off)',
    statutoryReg: 'IES/ACES RE #4092',
    certExpiry: '2027-06-30',
    bizSafe: 'N/A (QP Rep)',
    biometricStatus: 'Active (All Zones)',
    ptwAuthority: ['Approve Structural RFI', 'Issue Site Memo'],
  },
  {
    id: 'USR-003',
    name: 'Lim Kah Heng',
    role: 'Resident Technical Officer (RTO)',
    organization: 'QP(S) Consultant Team',
    category: 'Consultant / RE / RTO',
    cdePermission: 'Statutory Inspector (Level 3 - RFI Inspection)',
    statutoryReg: 'IES/ACES RTO #8814',
    certExpiry: '20
