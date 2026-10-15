import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function serviceError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw serviceError(400, 'Activity input must be an object');
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !Types.ObjectId.isValid(userId) ||
    typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId) ||
    typeof type !== 'string' || !type.trim() ||
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0
  ) {
    throw serviceError(400, 'Activity requires valid userId, teamId, type, and positive minutes');
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) throw serviceError(404, 'Activity user or team was not found');

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw serviceError(400, 'Team input must be an object');
  }

  const { name, mascot, members: submittedMembers } = input as Record<string, unknown>;
  const members = submittedMembers ?? [];
  if (
    typeof name !== 'string' || !name.trim() ||
    typeof mascot !== 'string' || !mascot.trim() ||
    !Array.isArray(members) ||
    !members.every((member) => typeof member === 'string' && Types.ObjectId.isValid(member))
  ) {
    throw serviceError(400, 'Team requires a name, mascot, and valid member IDs');
  }

  const memberIds = [...new Set(members as string[])];
  const existingMembers = await Promise.all(memberIds.map((id) => User.exists({ _id: id })));
  if (existingMembers.some((member) => !member)) {
    throw serviceError(404, 'One or more team members were not found');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const [totals, teams] = await Promise.all([
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
    Team.find().select('name').lean(),
  ]);

  const totalsByTeam = new Map<string, number>();
  for (const total of totals) totalsByTeam.set(total._id.toString(), total.totalPoints);

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: totalsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw serviceError(404, 'User was not found');

  const [workouts, recentActivity] = await Promise.all([
    Workout.find().lean(),
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
  ]);

  const goal = user.fitnessGoal.trim().toLowerCase();
  const activityType = recentActivity?.type.trim().toLowerCase();
  const activityFocus = activityType
    ? ({ run: 'endurance', running: 'endurance', cycle: 'endurance', cycling: 'endurance' }[activityType] ?? activityType)
    : undefined;
  const matchesGoal = (workout: (typeof workouts)[number]) => workout.focus.trim().toLowerCase() === goal;
  const matchesActivity = (workout: (typeof workouts)[number]) => workout.focus.trim().toLowerCase() === activityFocus;

  return workouts
    .sort((left, right) => {
      const leftScore = Number(matchesGoal(left)) * 2 + Number(matchesActivity(left));
      const rightScore = Number(matchesGoal(right)) * 2 + Number(matchesActivity(right));
      return rightScore - leftScore || left.title.localeCompare(right.title);
    })
    .map((workout) => {
      let reason = `An additional workout option for your ${user.fitnessGoal} goal.`;
      if (matchesGoal(workout)) {
        reason = recentActivity
          ? `Matches your ${user.fitnessGoal} goal and recent ${recentActivity.type} activity.`
          : `Matches your ${user.fitnessGoal} goal.`;
      } else if (matchesActivity(workout) && recentActivity) {
        reason = `Recommended based on your recent ${recentActivity.type} activity.`;
      }
      return { ...workout, reason };
    });
}

export { User };
