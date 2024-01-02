const createOwnerProfile = (owner) => {
  if (owner.user.type !== "person") {
    return;
  }

  const ownerObj = {
    avatar: owner.user.avatar_url || null,
    name: owner.user.name || null,
    email: owner.user.person.email || null,
  };
  return ownerObj;
};

module.exports = { createOwnerProfile };
