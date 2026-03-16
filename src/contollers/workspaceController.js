export const getUserWorkspaces = async (req, res) => {
    try {

        const userId = req.user.id;

        const workspaces = await prisma.workspaceMember.findMany({
            where: { userId },
            include: {
                workspace: true,
            },
        });

        res.status(200).json({
            success: true,
            data: workspaces,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch workspaces",
        });
    }
};