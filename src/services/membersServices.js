import prisma from "../config/prisma.js";
import { createError } from "../utils/error.js";

// Service to add a member to a project with checks for team lead role and workspace membership
export const addProjectMemberService = async (userId, projectId, email) => {

  // Fetch project + access check
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        members: {
          some: { userId }
        }
      }
    }
  });

  if (!project) {
    throw createError("Project not found or access denied", 404);
  }

  // Only team lead can add members
  if (project.team_lead !== userId) {
    throw createError("Only team lead can add members", 403);
  }

  // Convert email → userId
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (!user) {
    throw createError("User not found", 404);
  }

  const memberId = user.id;

  // Check workspace membership
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: project.workspaceId,
      userId: memberId
    }
  });

  if (!workspaceMember) {
    throw createError("User is not part of the workspace", 400);
  }

  // Check already exists
  const existingMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: memberId,
        projectId
      }
    }
  });

  if (existingMember) {
    throw createError("User already in project", 400);
  }

  // Add member
  const newMember = await prisma.projectMember.create({
    data: {
      userId: memberId,
      projectId
    },
    include: {
      user: true
    }
  });
  return {
    message: "Member added successfully",
    projectId,
    newMember
  };
};

// service to remove member from project with checks for team lead and idempotency
export const removeProjectMemberService = async (
  userId,
  projectId,
  memberId
) => {
  // Check project access (user must belong to workspace)
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        members: {
          some: { userId },
        },
      },
    },
  });

  if (!project) {
    throw createError("Project not found or access denied", 404);
  }

  // Only team lead can remove
  if (project.team_lead !== userId) {
    throw createError("Only team lead can remove members", 403);
  }

  // Prevent removing team lead
  if (project.team_lead === memberId) {
    throw createError("Team lead cannot be removed", 400);
  }

  // Check if member exists in project
  const existingMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: memberId,
        projectId,
      },
    },
  });

  // Idempotent behavior
  if (!existingMember) {
    return {
      message: "Member already removed",
      projectId,
      memberId,
    };
  }

  // Delete member
  await prisma.projectMember.delete({
    where: {
      userId_projectId: {
        userId: memberId,
        projectId,
      },
    },
  });

  return {
    message: "Member removed successfully",
    projectId,
    memberId,
  };
};

// service to get project members with user details
export const getProjectMembersService = async (userId, projectId) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        members: {
          some: { userId }
        }
      }
    },
    include: {
      members: {
        include: {
          user: true
        }
      }
    }
  });

  if (!project) {
    throw createError(404, "Project not found or access denied",);
  }

  return project.members;
};