const db = require('./db');
const { FAMILY_ROLES, normalizeRole } = require('./family.permissions');
const { logFamilyActivity } = require('./family.activity');

async function getUserFamily(userId) {
  const [rows] = await db.query(
    `
    SELECT
      f.*,
      fm.id AS membership_id,
      fm.role,
      fm.joined_at
    FROM family_members fm
    INNER JOIN families f ON f.id = fm.family_id
    WHERE fm.user_id = ?
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}

async function getFamilyById(familyId) {
  const [rows] = await db.query('SELECT * FROM families WHERE id = ? LIMIT 1', [familyId]);
  return rows[0] || null;
}

async function getFamilyMember(familyId, userId) {
  const [rows] = await db.query(
    `
    SELECT fm.id, fm.family_id, fm.user_id, fm.role, fm.joined_at, u.name, u.email
    FROM family_members fm
    INNER JOIN users u ON u.id = fm.user_id
    WHERE fm.family_id = ? AND fm.user_id = ?
    LIMIT 1
    `,
    [familyId, userId]
  );

  return rows[0] || null;
}

async function getFamilyMembers(familyId) {
  const [rows] = await db.query(
    `
    SELECT
      fm.id AS membership_id,
      fm.family_id,
      fm.user_id AS id,
      fm.role,
      fm.joined_at,
      fm.updated_at,
      u.name,
      u.email
    FROM family_members fm
    INNER JOIN users u ON u.id = fm.user_id
    WHERE fm.family_id = ?
    ORDER BY
      CASE fm.role
        WHEN 'owner' THEN 0
        WHEN 'editor' THEN 1
        ELSE 2
      END,
      u.name ASC
    `,
    [familyId]
  );

  return rows;
}


async function ensureFamilyAvatarColumn() {
  const [columns] = await db.query(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'families'
      AND COLUMN_NAME = 'avatar_url'
    LIMIT 1
    `
  );

  if (columns.length === 0) {
    await db.query('ALTER TABLE families ADD COLUMN avatar_url VARCHAR(255) NULL AFTER name');
  }
}

async function countFamilyOwners(familyId) {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS total FROM family_members WHERE family_id = ? AND role = ?',
    [familyId, FAMILY_ROLES.OWNER]
  );

  return Number(rows[0] ? rows[0].total : 0);
}

async function createFamily({ userId, name, avatarUrl = null }) {
  await ensureFamilyAvatarColumn();

  const existingFamily = await getUserFamily(userId);
  if (existingFamily) {
    throw new Error('You already belong to a family.');
  }

  const cleanName = String(name || '').trim();
  if (!cleanName) {
    throw new Error('Family name is required.');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO families (name, avatar_url, owner_user_id) VALUES (?, ?, ?)',
      [cleanName, avatarUrl, userId]
    );

    await connection.query(
      'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, userId, FAMILY_ROLES.OWNER]
    );

    await connection.commit();

    await logFamilyActivity({
      familyId: result.insertId,
      actorUserId: userId,
      action: 'family_created',
      entityType: 'family',
      entityId: result.insertId,
      description: `Created family workspace "${cleanName}".`
    });

    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateFamilyName({ familyId, actorUserId, name }) {
  const cleanName = String(name || '').trim();
  if (!cleanName) {
    throw new Error('Family name is required.');
  }

  const family = await getFamilyById(familyId);
  if (!family) {
    throw new Error('Family not found.');
  }

  await db.query('UPDATE families SET name = ? WHERE id = ? LIMIT 1', [cleanName, familyId]);

  await logFamilyActivity({
    familyId,
    actorUserId,
    action: 'family_name_updated',
    entityType: 'family',
    entityId: familyId,
    description: `Changed family name from "${family.name}" to "${cleanName}".`
  });
}


async function ensureFamilyMottoColumn() {
  const [columns] = await db.query(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'families'
      AND COLUMN_NAME = 'motto'
    LIMIT 1
    `
  );

  if (columns.length === 0) {
    await db.query('ALTER TABLE families ADD COLUMN motto VARCHAR(140) NULL AFTER name');
  }
}

async function updateFamilyMotto({ familyId, actorUserId, motto }) {
  const cleanMotto = String(motto || '').trim().slice(0, 140) || null;
  const family = await getFamilyById(familyId);

  if (!family) {
    throw new Error('Family not found.');
  }

  await ensureFamilyMottoColumn();
  await db.query('UPDATE families SET motto = ? WHERE id = ? LIMIT 1', [cleanMotto, familyId]);

  await logFamilyActivity({
    familyId,
    actorUserId,
    action: 'family_motto_updated',
    entityType: 'family',
    entityId: familyId,
    description: cleanMotto ? 'Updated family motto.' : 'Removed family motto.'
  });
}

async function updateFamilyAvatar({ familyId, actorUserId, avatarUrl }) {
  await ensureFamilyAvatarColumn();

  const cleanAvatarUrl = avatarUrl ? String(avatarUrl).trim() : null;

  await db.query('UPDATE families SET avatar_url = ? WHERE id = ? LIMIT 1', [cleanAvatarUrl, familyId]);

  await logFamilyActivity({
    familyId,
    actorUserId,
    action: 'family_avatar_updated',
    entityType: 'family',
    entityId: familyId,
    description: cleanAvatarUrl ? 'Updated family avatar.' : 'Removed family avatar.'
  });
}

async function addFamilyMember({ familyId, actorUserId, email, role = FAMILY_ROLES.VIEWER }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const cleanRole = normalizeRole(role);

  if (!normalizedEmail) {
    throw new Error('Email is required.');
  }

  const [usersFound] = await db.query(
    'SELECT id, name, email FROM users WHERE LOWER(email) = ? LIMIT 1',
    [normalizedEmail]
  );

  if (usersFound.length === 0) {
    throw new Error('User with this email was not found.');
  }

  const user = usersFound[0];

  const existingFamily = await getUserFamily(user.id);
  if (existingFamily) {
    if (existingFamily.id === familyId) {
      throw new Error('This user is already a member of your family.');
    }

    throw new Error('This user already belongs to another family.');
  }

  await db.query(
    'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)',
    [familyId, user.id, cleanRole]
  );

  await logFamilyActivity({
    familyId,
    actorUserId,
    targetUserId: user.id,
    action: 'member_added',
    entityType: 'member',
    entityId: user.id,
    description: `Added ${user.name || user.email} as ${cleanRole}.`
  });

  return user;
}

async function changeMemberRole({ familyId, actorUserId, targetUserId, role }) {
  const cleanRole = normalizeRole(role);
  const targetMember = await getFamilyMember(familyId, targetUserId);

  if (!targetMember) {
    throw new Error('Family member not found.');
  }

  if (targetMember.role === FAMILY_ROLES.OWNER && cleanRole !== FAMILY_ROLES.OWNER) {
    const ownersCount = await countFamilyOwners(familyId);
    if (ownersCount <= 1) {
      throw new Error('Family must have at least one owner. Add another owner before changing this role.');
    }
  }

  await db.query(
    'UPDATE family_members SET role = ? WHERE family_id = ? AND user_id = ? LIMIT 1',
    [cleanRole, familyId, targetUserId]
  );

  const owners = await getFamilyMembers(familyId);
  const firstOwner = owners.find((member) => member.role === FAMILY_ROLES.OWNER);

  if (firstOwner) {
    await db.query('UPDATE families SET owner_user_id = ? WHERE id = ? LIMIT 1', [firstOwner.id, familyId]);
  }

  await logFamilyActivity({
    familyId,
    actorUserId,
    targetUserId,
    action: 'member_role_updated',
    entityType: 'member',
    entityId: targetUserId,
    description: `Changed ${targetMember.name || targetMember.email} role from ${targetMember.role} to ${cleanRole}.`
  });
}

async function removeFamilyMember({ familyId, actorUserId, targetUserId }) {
  const targetMember = await getFamilyMember(familyId, targetUserId);

  if (!targetMember) {
    throw new Error('Family member not found.');
  }

  if (targetMember.role === FAMILY_ROLES.OWNER) {
    const ownersCount = await countFamilyOwners(familyId);
    if (ownersCount <= 1) {
      throw new Error('You cannot remove the last family owner.');
    }
  }

  await db.query(
    'DELETE FROM family_members WHERE family_id = ? AND user_id = ? LIMIT 1',
    [familyId, targetUserId]
  );

  await logFamilyActivity({
    familyId,
    actorUserId,
    targetUserId,
    action: 'member_removed',
    entityType: 'member',
    entityId: targetUserId,
    description: `Removed ${targetMember.name || targetMember.email} from the family.`
  });
}

async function leaveFamily({ familyId, actorUserId }) {
  const member = await getFamilyMember(familyId, actorUserId);

  if (!member) {
    throw new Error('Family member not found.');
  }

  if (member.role === FAMILY_ROLES.OWNER) {
    const ownersCount = await countFamilyOwners(familyId);
    if (ownersCount <= 1) {
      throw new Error('You are the last owner. Transfer owner rights before leaving the family.');
    }
  }

  await db.query(
    'DELETE FROM family_members WHERE family_id = ? AND user_id = ? LIMIT 1',
    [familyId, actorUserId]
  );

  const owners = await getFamilyMembers(familyId);
  const firstOwner = owners.find((familyMember) => familyMember.role === FAMILY_ROLES.OWNER);
  if (firstOwner) {
    await db.query('UPDATE families SET owner_user_id = ? WHERE id = ? LIMIT 1', [firstOwner.id, familyId]);
  }

  await logFamilyActivity({
    familyId,
    actorUserId,
    targetUserId: actorUserId,
    action: 'member_left',
    entityType: 'member',
    entityId: actorUserId,
    description: `${member.name || member.email} left the family.`
  });
}

async function deleteFamily({ familyId, actorUserId }) {
  await logFamilyActivity({
    familyId,
    actorUserId,
    action: 'family_deleted',
    entityType: 'family',
    entityId: familyId,
    description: 'Family workspace was deleted.'
  });

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query('UPDATE calendar_events SET family_id = NULL WHERE family_id = ?', [familyId]);
    await connection.query('DELETE FROM families WHERE id = ? LIMIT 1', [familyId]);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getUserFamily,
  getFamilyById,
  getFamilyMember,
  getFamilyMembers,
  countFamilyOwners,
  createFamily,
  updateFamilyName,
  updateFamilyMotto,
  updateFamilyAvatar,
  addFamilyMember,
  changeMemberRole,
  removeFamilyMember,
  leaveFamily,
  deleteFamily
};
