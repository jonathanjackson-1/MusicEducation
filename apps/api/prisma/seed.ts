import { PrismaClient, UserRole } from '@prisma/client';
import * as argon from 'argon2';

async function main() {
  const prisma = new PrismaClient();
  const studio = await prisma.studio.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Demo Studio',
      subdomain: 'demo',
      timeZone: 'America/New_York',
    },
  });

  const instrument = await prisma.instrument.upsert({
    where: { studioId_name: { studioId: studio.id, name: 'Piano' } },
    update: {},
    create: { studioId: studio.id, name: 'Piano' },
  });

  const passwords = await Promise.all(['admin', 'educator', 'student', 'parent'].map((pwd) => argon.hash(`${pwd}123!`)));

  const [admin, educator, student, parent] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@demo.local' },
      update: {},
      create: {
        email: 'admin@demo.local',
        firstName: 'Ada',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        passwordHash: passwords[0],
        studioId: studio.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'educator@demo.local' },
      update: {},
      create: {
        email: 'educator@demo.local',
        firstName: 'Eli',
        lastName: 'Educator',
        role: UserRole.EDUCATOR,
        passwordHash: passwords[1],
        studioId: studio.id,
        instrumentId: instrument.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'student@demo.local' },
      update: {},
      create: {
        email: 'student@demo.local',
        firstName: 'Sia',
        lastName: 'Student',
        role: UserRole.STUDENT,
        passwordHash: passwords[2],
        studioId: studio.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'parent@demo.local' },
      update: {},
      create: {
        email: 'parent@demo.local',
        firstName: 'Pat',
        lastName: 'Parent',
        role: UserRole.PARENT,
        passwordHash: passwords[3],
        studioId: studio.id,
      },
    }),
  ]);

  await prisma.studioMember.upsert({
    where: { studioId_userId: { studioId: studio.id, userId: admin.id } },
    update: { role: UserRole.ADMIN },
    create: { studioId: studio.id, userId: admin.id, role: UserRole.ADMIN },
  });
  await prisma.studioMember.upsert({
    where: { studioId_userId: { studioId: studio.id, userId: educator.id } },
    update: { role: UserRole.EDUCATOR, instrumentId: instrument.id },
    create: {
      studioId: studio.id,
      userId: educator.id,
      role: UserRole.EDUCATOR,
      instrumentId: instrument.id,
    },
  });
  await prisma.studioMember.upsert({
    where: { studioId_userId: { studioId: studio.id, userId: student.id } },
    update: { role: UserRole.STUDENT },
    create: { studioId: studio.id, userId: student.id, role: UserRole.STUDENT },
  });
  await prisma.studioMember.upsert({
    where: { studioId_userId: { studioId: studio.id, userId: parent.id } },
    update: { role: UserRole.PARENT },
    create: { studioId: studio.id, userId: parent.id, role: UserRole.PARENT },
  });

  const room = await prisma.room.upsert({
    where: { studioId_name: { studioId: studio.id, name: 'Room 1' } },
    update: {},
    create: { studioId: studio.id, name: 'Room 1', capacity: 4 },
  });

  const lesson = await prisma.lesson.upsert({
    where: { id: 'demo-lesson' },
    update: {},
    create: {
      id: 'demo-lesson',
      studioId: studio.id,
      title: 'Weekly Piano Lesson',
      description: 'Introductory piano lesson',
      educatorId: educator.id,
      studentId: student.id,
      roomId: room.id,
      recurrenceRule: 'RRULE:FREQ=WEEKLY;COUNT=10',
      startDate: new Date().toISOString(),
    },
  });

  await prisma.lessonOccurrence.upsert({
    where: { id: 'demo-occurrence' },
    update: {},
    create: {
      id: 'demo-occurrence',
      lessonId: lesson.id,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
  });

  const template = await prisma.assignmentTemplate.upsert({
    where: { id: 'demo-template' },
    update: {},
    create: {
      id: 'demo-template',
      studioId: studio.id,
      title: 'Scale Practice',
      description: 'Practice C major scale',
    },
  });

  const assignment = await prisma.assignment.upsert({
    where: { id: 'demo-assignment' },
    update: {},
    create: {
      id: 'demo-assignment',
      studioId: studio.id,
      templateId: template.id,
      lessonId: lesson.id,
      assignedById: educator.id,
      assignedToId: student.id,
      title: 'Scale Practice Week 1',
      instructions: 'Practice hands together, 10 minutes daily',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.assignment.upsert({
    where: { id: 'demo-assignment-2' },
    update: {},
    create: {
      id: 'demo-assignment-2',
      studioId: studio.id,
      assignedById: educator.id,
      assignedToId: student.id,
      title: 'Arpeggio Study',
      instructions: 'Focus on smooth transitions',
    },
  });

  await prisma.practiceGoal.upsert({
    where: { id: 'demo-goal' },
    update: {},
    create: {
      id: 'demo-goal',
      studioId: studio.id,
      studentId: student.id,
      title: 'Daily Practice',
      targetMinutes: 140,
      startDate: new Date(),
    },
  });

  await prisma.practiceLog.createMany({
    data: [
      {
        studioId: studio.id,
        studentId: student.id,
        durationMinutes: 30,
        notes: 'Worked on scales',
      },
      {
        studioId: studio.id,
        studentId: student.id,
        durationMinutes: 25,
        notes: 'Arpeggio focus',
      },
    ],
  });

  await prisma.submission.upsert({
    where: { id: 'demo-submission' },
    update: {},
    create: {
      id: 'demo-submission',
      assignmentId: assignment.id,
      studioId: studio.id,
      submittedById: student.id,
      content: 'Practiced daily, attached notes.',
    },
  });

  console.log('Seed data created');
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
