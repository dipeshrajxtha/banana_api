/**
 * @file seedAdmin.js
 * @description Auto-provisions the primary system administrator account if none exists.
 * @module server/db/seedAdmin
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import { usersRepository } from './usersRepository.js';
import { auditRepository } from './auditRepository.js';
import { hashPassword } from '../utils/auth.js';

const DEFAULT_ADMIN = {
  email: 'admin@bananaquest.com',
  username: 'SystemAdministrator',
  password: 'AdminSecret2026!',
  role: 'admin'
};

/**
 * Seeds default administrator for academic demonstration and RBAC testing
 */
export async function seedAdmin() {
  try {
    const existingAdmin = await usersRepository.findByEmail(DEFAULT_ADMIN.email);
    if (!existingAdmin) {
      const passwordHash = await hashPassword(DEFAULT_ADMIN.password);
      const admin = await usersRepository.create({
        email: DEFAULT_ADMIN.email,
        username: DEFAULT_ADMIN.username,
        passwordHash,
        authProvider: 'local',
        role: 'admin'
      });

      await auditRepository.log({
        userId: admin.id,
        action: 'ADMIN_SEEDED',
        details: { email: admin.email, role: 'admin' }
      });

      console.log(`🛡️  Default Admin provisioned: ${DEFAULT_ADMIN.email}`);
      return admin;
    }
    return existingAdmin;
  } catch (err) {
    console.error('[AdminSeeder] Error checking or seeding admin account:', err.message);
  }
}
