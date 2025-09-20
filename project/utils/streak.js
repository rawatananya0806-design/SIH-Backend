function updateUserStreak(user) {
  const today = new Date();
  const last = user.lastQuizDate;

  if (!last) {
    user.streak = 1;
  } else {
    const diff = Math.floor((today - last) / (1000 * 60 * 60 * 24));
    if (diff === 1) user.streak += 1;
    else if (diff > 1) user.streak = 1;
  }

  user.lastQuizDate = today;
  user.calculateProgress();
}

module.exports = { updateUserStreak };
