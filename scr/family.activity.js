const db = require('./db');

async function logFamilyActivity({
  familyId,
  actorUserId,
  targetUserId = null,
  action,
  entityType = 'family',
  entityId = null,
  description = ''
}) {
  if (!familyId || !actorUserId || !action) return;

  await db.query(
    `
    INSERT INTO family_activity_logs
      (family_id, actor_user_id, target_user_id, action, entity_type, entity_id, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [familyId, actorUserId, targetUserId, action, entityType, entityId, description]
  );
}

async function getFamilyActivity(familyId, limit = 20) {
  const safeLimit = Number.isInteger(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 100) : 20;

  const [rows] = await db.query(
    `
    SELECT
      fal.id,
      fal.family_id,
      fal.actor_user_id,
      fal.target_user_id,
      fal.action,
      fal.entity_type,
      fal.entity_id,
      fal.description,
      fal.created_at,
      actor.name AS actor_name,
      actor.email AS actor_email,
      target.name AS target_name,
      target.email AS target_email
    FROM family_activity_logs fal
    LEFT JOIN users actor ON actor.id = fal.actor_user_id
    LEFT JOIN users target ON target.id = fal.target_user_id
    WHERE fal.family_id = ?
    ORDER BY fal.created_at DESC, fal.id DESC
    LIMIT ${safeLimit}
    `,
    [familyId]
  );

  return rows;
}

async function getMemberActivity(familyId, userId, limit = 50) {
  const safeLimit = Number.isInteger(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 100) : 50;

  const [rows] = await db.query(
    `
    SELECT
      fal.id,
      fal.family_id,
      fal.actor_user_id,
      fal.target_user_id,
      fal.action,
      fal.entity_type,
      fal.entity_id,
      fal.description,
      fal.created_at,
      actor.name AS actor_name,
      actor.email AS actor_email,
      target.name AS target_name,
      target.email AS target_email
    FROM family_activity_logs fal
    LEFT JOIN users actor ON actor.id = fal.actor_user_id
    LEFT JOIN users target ON target.id = fal.target_user_id
    WHERE fal.family_id = ?
      AND fal.actor_user_id = ?
    ORDER BY fal.created_at DESC, fal.id DESC
    LIMIT ${safeLimit}
    `,
    [familyId, userId]
  );

  return rows;
}

module.exports = {
  logFamilyActivity,
  getFamilyActivity,
  getMemberActivity
};
