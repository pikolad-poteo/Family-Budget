const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const router = express.Router();
const { requireAuth } = require('../scr/middleware');
const {
  getUserFamily,
  getFamilyMembers,
  createFamily,
  updateFamilyName,
  updateFamilyMotto,
  updateFamilyAvatar,
  addFamilyMember,
  changeMemberRole,
  removeFamilyMember,
  leaveFamily,
  deleteFamily
} = require('../scr/family.service');
const { getFamilyActivity, getMemberActivity } = require('../scr/family.activity');
const { canManageFamily, canManageMembers, canDeleteFamily, canEditBudget, FAMILY_ROLES } = require('../scr/family.permissions');

const familyUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'family');
fs.mkdirSync(familyUploadDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }

    return cb(null, true);
  }
});

function setFamilyFlash(req, type, message) {
  req.session.familyFlash = { type, message };
}

function getFamilyFlash(req) {
  const flash = req.session.familyFlash || null;
  delete req.session.familyFlash;
  return flash;
}

function getAvatarUrl(filename) {
  return filename ? `/uploads/family/${filename}` : null;
}

function removeLocalFamilyAvatar(avatarUrl) {
  if (!avatarUrl || !avatarUrl.startsWith('/uploads/family/')) return;

  const filePath = path.join(__dirname, '..', 'public', avatarUrl);
  if (!filePath.startsWith(familyUploadDir)) return;

  fs.promises.unlink(filePath).catch((error) => {
    if (error.code !== 'ENOENT') {
      console.error('Failed to remove old family avatar:', error.message);
    }
  });
}

async function saveCompressedFamilyAvatar(file) {
  if (!file) return null;

  const filename = `family-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
  const outputPath = path.join(familyUploadDir, filename);

  await sharp(file.buffer)
    .rotate()
    .resize(512, 512, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({
      quality: 86,
      mozjpeg: true
    })
    .toFile(outputPath);

  return filename;
}

async function renderFamilyPage(req, res, overrides = {}) {
  const currentUserId = req.session.user.id;
  const family = await getUserFamily(currentUserId);
  const members = family ? await getFamilyMembers(family.id) : [];
  const activity = family ? await getFamilyActivity(family.id, 100) : [];
  const currentRole = family ? family.role : null;
  const flash = getFamilyFlash(req);

  return res.render('family/index', {
    title: 'Family',
    activePage: 'family',
    family,
    members,
    activity,
    selectedMemberActivity: [],
    selectedMember: null,
    currentRole,
    roles: FAMILY_ROLES,
    permissions: {
      canManageFamily: canManageFamily(currentRole),
      canManageMembers: canManageMembers(currentRole),
      canDeleteFamily: canDeleteFamily(currentRole)
    },
    errorMessage: flash && flash.type === 'error' ? flash.message : '',
    successMessage: flash && flash.type === 'success' ? flash.message : '',
    ...overrides
  });
}

router.get('/family', requireAuth, async (req, res) => {
  try {
    return await renderFamilyPage(req, res);
  } catch (error) {
    console.error('Family page error:', error.message);

    return res.render('family/index', {
      title: 'Family',
      activePage: 'family',
      family: null,
      members: [],
      activity: [],
      selectedMemberActivity: [],
      selectedMember: null,
      currentRole: null,
      roles: FAMILY_ROLES,
      permissions: { canManageFamily: false, canManageMembers: false, canDeleteFamily: false },
      errorMessage: 'Failed to load family data.',
      successMessage: ''
    });
  }
});

router.get('/family/activity/:userId', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.user.id;
    const family = await getUserFamily(currentUserId);

    if (!family) {
      setFamilyFlash(req, 'error', 'Create or join a family first.');
      return res.redirect('/family');
    }

    const members = await getFamilyMembers(family.id);
    const selectedMember = members.find((member) => Number(member.id) === Number(req.params.userId));

    if (!selectedMember) {
      setFamilyFlash(req, 'error', 'Family member not found.');
      return res.redirect('/family');
    }

    const selectedMemberActivity = await getMemberActivity(family.id, selectedMember.id, 50);

    return await renderFamilyPage(req, res, {
      selectedMember,
      selectedMemberActivity
    });
  } catch (error) {
    console.error('Family member activity error:', error.message);
    setFamilyFlash(req, 'error', 'Failed to load member activity.');
    return res.redirect('/family');
  }
});

router.post('/family/create', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.user.id;

    await createFamily({
      userId: currentUserId,
      name: req.body.familyName
    });

    setFamilyFlash(req, 'success', 'Family workspace was created.');
    return res.redirect('/family');
  } catch (error) {
    console.error('Family creation error:', error.message);
    setFamilyFlash(req, 'error', error.message || 'Failed to create family.');
    return res.redirect('/family');
  }
});

router.post('/family/update', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.user.id;
    const family = await getUserFamily(currentUserId);

    if (!family || !canManageFamily(family.role)) {
      setFamilyFlash(req, 'error', 'Only family owners can update family settings.');
      return res.redirect('/family');
    }

    await updateFamilyName({
      familyId: family.id,
      actorUserId: currentUserId,
      name: req.body.familyName
    });

    setFamilyFlash(req, 'success', 'Family name was updated.');
    return res.redirect('/family');
  } catch (error) {
    console.error('Family update error:', error.message);
    setFamilyFlash(req, 'error', error.message || 'Failed to update family.');
    return res.redirect('/family');
  }
});


router.post('/family/motto', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.user.id;
    const family = await getUserFamily(currentUserId);

    if (!family || !canManageFamily(family.role)) {
      setFamilyFlash(req, 'error', 'Only family owners can update family settings.');
      return res.redirect('/family');
    }

    await updateFamilyMotto({
      familyId: family.id,
      actorUserId: currentUserId,
      motto: req.body.motto
    });

    setFamilyFlash(req, 'success', 'Family motto was updated.');
    return res.redirect('/family');
  } catch (error) {
    console.error('Family motto update error:', error.message);
    setFamilyFlash(req, 'error', error.message || 'Failed to update family motto.');
    return res.redirect('/family');
  }
});

router.post('/family/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    const currentUserId = req.session.user.id;
    const family = await getUserFamily(currentUserId);

    if (!family || !canEditBudget(family.role)) {
      setFamilyFlash(req, 'error', 'Only family owners and editors can update the avatar.');
      return res.redirect('/family');
    }

    if (!req.file) {
      setFamilyFlash(req, 'error', 'Choose an image file first.');
      return res.redirect('/family');
    }

    const filename = await saveCompressedFamilyAvatar(req.file);
    const avatarUrl = getAvatarUrl(filename);

    await updateFamilyAvatar({ familyId: family.id, actorUserId: currentUserId, avatarUrl });
    removeLocalFamilyAvatar(family.avatar_url);

    setFamilyFlash(req, 'success', 'Family avatar was updated.');
    return res.redirect('/family');
  } catch (error) {
    console.error('Family avatar update error:', error.message);
    setFamilyFlash(req, 'error', error.message || 'Failed to update family avatar.');
    return res.redirect('/family');
  }
});

router.post('/family/avatar/delete', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.user.id;
    const family = await getUserFamily(currentUserId);

    if (!family || !canEditBudget(family.role)) {
      setFamilyFlash(req, 'error', 'Only family owners and editors can delete the avatar.');
      return res.redirect('/family');
    }

    await updateFamilyAvatar({ familyId: family.id, actorUserId: currentUserId, avatarUrl: null });
    removeLocalFamilyAvatar(family.avatar_url);

    setFamilyFlash(req, 'success', 'Family avatar was deleted.');
    return res.redirect('/family');
  } catch (error) {
    console.error('Family avatar delete error:', error.message);
    setFamilyFlash(req, 'error', error.message || 'Failed to delete family avatar.');
    return res.redirect('/family');
  }
});

router.post('/family/members/add', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.user.id;
    const family = await getUserFamily(currentUserId);

    if (!family || !canManageMembers(family.role)) {
      setFamilyFlash(req, 'error', 'Only family owners can add members.');
      return res.redirect('/family');
    }

    await addFamilyMember({
      familyId: family.id,
      actorUserId: currentUserId,
      email: req.body.email,
      role: req.body.role || FAMILY_ROLES.VIEWER
    });

    setFamilyFlash(req, 'success', 'Family member was added.');
    return res.redirect('/family');
  } catch (error) {
    console.error('Add family member error:', error.message);
    setFamilyFlash(req, 'error', error.message || 'Failed to add member.');
    return res.redirect('/family');
  }
});

router.post('/family/members/:userId/role', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.user.id;
    const family = await getUserFamily(currentUserId);

    if (!family || !canManageMembers(family.role)) {
      setFamilyFlash(req, 'error', 'Only family owners can change roles.');
      return res.redirect('/family');
    }

    await changeMemberRole({
      familyId: family.id,
      actorUserId: currentUserId,
      targetUserId: Number(req.params.userId),
      role: req.body.role
    });

    setFamilyFlash(req, 'success', 'Member role was updated.');
    return res.redirect('/family');
  } catch (error) {
    console.error('Change family member role error:', error.message);
    setFamilyFlash(req, 'error', error.message || 'Failed to update member role.');
    return res.redirect('/family');
  }
});

router.post('/family/members/:userId/remove', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.user.id;
    const family = await getUserFamily(currentUserId);
    const targetUserId = Number(req.params.userId);

    if (!family || !canManageMembers(family.role)) {
      setFamilyFlash(req, 'error', 'Only family owners can remove members.');
      return res.redirect('/family');
    }

    if (targetUserId === currentUserId) {
      setFamilyFlash(req, 'error', 'Use the Leave family action to remove yourself.');
      return res.redirect('/family');
    }

    await removeFamilyMember({ familyId: family.id, actorUserId: currentUserId, targetUserId });

    setFamilyFlash(req, 'success', 'Family member was removed.');
    return res.redirect('/family');
  } catch (error) {
    console.error('Remove family member error:', error.message);
    setFamilyFlash(req, 'error', error.message || 'Failed to remove member.');
    return res.redirect('/family');
  }
});

router.post('/family/leave', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.user.id;
    const family = await getUserFamily(currentUserId);

    if (!family) {
      setFamilyFlash(req, 'error', 'You are not a member of any family.');
      return res.redirect('/family');
    }

    await leaveFamily({ familyId: family.id, actorUserId: currentUserId });

    setFamilyFlash(req, 'success', 'You left the family.');
    return res.redirect('/family');
  } catch (error) {
    console.error('Leave family error:', error.message);
    setFamilyFlash(req, 'error', error.message || 'Failed to leave family.');
    return res.redirect('/family');
  }
});

router.post('/family/delete', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.user.id;
    const family = await getUserFamily(currentUserId);
    const confirmation = String(req.body.confirmation || '').trim();

    if (!family || !canDeleteFamily(family.role)) {
      setFamilyFlash(req, 'error', 'Only family owners can delete the family.');
      return res.redirect('/family');
    }

    if (confirmation !== 'Delete') {
      setFamilyFlash(req, 'error', 'Type Delete to confirm family deletion.');
      return res.redirect('/family');
    }

    await deleteFamily({ familyId: family.id, actorUserId: currentUserId });

    setFamilyFlash(req, 'success', 'Family workspace was deleted. Shared data was detached from the deleted family.');
    return res.redirect('/family');
  } catch (error) {
    console.error('Delete family error:', error.message);
    setFamilyFlash(req, 'error', error.message || 'Failed to delete family.');
    return res.redirect('/family');
  }
});

module.exports = router;
