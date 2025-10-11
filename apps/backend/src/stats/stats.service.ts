import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Parallel queries for performance
    const [
      totalMachines,
      totalMaintenances,
      totalDocuments,
      totalUsers,
      machinesThisMonth,
      machinesLastMonth,
      maintenancesThisMonth,
      maintenancesLastMonth,
      documentsThisMonth,
      documentsLastMonth,
      maintenancesByType,
      upcomingScheduled,
      machinesByCategory,
      documentsByCategory,
    ] = await Promise.all([
      // Total counts
      this.prisma.machine.count(),
      this.prisma.maintenance.count(),
      this.prisma.document.count(),
      this.prisma.user.count({ where: { isActive: true } }),

      // Machines added this month
      this.prisma.machine.count({
        where: {
          createdAt: {
            gte: firstDayOfMonth,
          },
        },
      }),

      // Machines added last month
      this.prisma.machine.count({
        where: {
          createdAt: {
            gte: firstDayOfLastMonth,
            lte: lastDayOfLastMonth,
          },
        },
      }),

      // This month maintenances
      this.prisma.maintenance.count({
        where: {
          date: {
            gte: firstDayOfMonth,
          },
        },
      }),

      // Last month maintenances
      this.prisma.maintenance.count({
        where: {
          date: {
            gte: firstDayOfLastMonth,
            lte: lastDayOfLastMonth,
          },
        },
      }),

      // Documents uploaded this month
      this.prisma.document.count({
        where: {
          uploadedAt: {
            gte: firstDayOfMonth,
          },
        },
      }),

      // Documents uploaded last month
      this.prisma.document.count({
        where: {
          uploadedAt: {
            gte: firstDayOfLastMonth,
            lte: lastDayOfLastMonth,
          },
        },
      }),

      // Maintenances by type
      this.prisma.maintenance.groupBy({
        by: ['type'],
        _count: { type: true },
      }),

      // Upcoming scheduled maintenances (next 30 days)
      this.prisma.scheduledMaintenance.count({
        where: {
          nextDueDate: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Machines by category
      this.prisma.machine.findMany({
        select: {
          type: {
            select: {
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),

      // Documents by category
      this.prisma.document.groupBy({
        by: ['documentCategory'],
        _count: { documentCategory: true },
      }),
    ]);

    // Calculate trends
    const machinesTrend =
      machinesLastMonth > 0
        ? Math.round(((machinesThisMonth - machinesLastMonth) / machinesLastMonth) * 100)
        : machinesThisMonth > 0
          ? 100
          : 0;

    const maintenanceTrend =
      maintenancesLastMonth > 0
        ? Math.round(
            ((maintenancesThisMonth - maintenancesLastMonth) / maintenancesLastMonth) * 100,
          )
        : maintenancesThisMonth > 0
          ? 100
          : 0;

    const documentsTrend =
      documentsLastMonth > 0
        ? Math.round(((documentsThisMonth - documentsLastMonth) / documentsLastMonth) * 100)
        : documentsThisMonth > 0
          ? 100
          : 0;

    // Transform maintenances by type
    const maintenancesByTypeFormatted = maintenancesByType.reduce(
      (acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Transform machines by category
    const categoryCount: Record<string, number> = {};
    machinesByCategory.forEach((machine) => {
      const categoryName = machine.type?.category?.name || 'Non categorizzato';
      categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
    });

    // Transform documents by category
    const documentsByCategoryFormatted = documentsByCategory.reduce(
      (acc, item) => {
        acc[item.documentCategory] = item._count.documentCategory;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      overview: {
        totalMachines,
        totalMaintenances,
        totalDocuments,
        totalUsers,
        upcomingScheduled,
      },
      thisMonth: {
        machines: machinesThisMonth,
        maintenances: maintenancesThisMonth,
        documents: documentsThisMonth,
        machinesTrend,
        maintenanceTrend,
        documentsTrend,
      },
      lastMonth: {
        machines: machinesLastMonth,
        maintenances: maintenancesLastMonth,
        documents: documentsLastMonth,
      },
      maintenancesByType: maintenancesByTypeFormatted,
      machinesByCategory: categoryCount,
      documentsByCategory: documentsByCategoryFormatted,
    };
  }

  async getMaintenanceTrends() {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    // Get maintenances for the last 6 months grouped by month
    const maintenances = await this.prisma.maintenance.findMany({
      where: {
        date: { gte: sixMonthsAgo },
      },
      select: {
        date: true,
        type: true,
      },
    });

    // Group by month
    const monthlyData: Record<string, { count: number; types: Record<string, number> }> = {};

    maintenances.forEach((m) => {
      const monthKey = `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, types: {} };
      }
      monthlyData[monthKey].count++;
      monthlyData[monthKey].types[m.type] = (monthlyData[monthKey].types[m.type] || 0) + 1;
    });

    // Convert to array and sort
    const trends = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        count: data.count,
        types: data.types,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return trends;
  }

  async getTypeAnalysis() {
    // Get all machines with their types and categories
    const machines = await this.prisma.machine.findMany({
      include: {
        type: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            maintenances: true,
            documents: true,
          },
        },
      },
    });

    // Group by type
    const typeStats: Record<
      string,
      { count: number; totalMaintenances: number; totalDocuments: number; category: string }
    > = {};

    machines.forEach((machine) => {
      const typeName = machine.type?.name || 'Non specificato';
      const categoryName = machine.type?.category?.name || 'Non categorizzato';

      if (!typeStats[typeName]) {
        typeStats[typeName] = {
          count: 0,
          totalMaintenances: 0,
          totalDocuments: 0,
          category: categoryName,
        };
      }

      typeStats[typeName].count++;
      typeStats[typeName].totalMaintenances += machine._count.maintenances;
      typeStats[typeName].totalDocuments += machine._count.documents;
    });

    // Convert to array and calculate averages
    const typeAnalysis = Object.entries(typeStats)
      .map(([type, data]) => ({
        type,
        category: data.category,
        machineCount: data.count,
        totalMaintenances: data.totalMaintenances,
        totalDocuments: data.totalDocuments,
        avgMaintenancesPerMachine: data.count > 0 ? data.totalMaintenances / data.count : 0,
        avgDocumentsPerMachine: data.count > 0 ? data.totalDocuments / data.count : 0,
      }))
      .sort((a, b) => b.machineCount - a.machineCount);

    // Category summary
    const categoryStats: Record<
      string,
      { machineCount: number; maintenanceCount: number; documentCount: number }
    > = {};

    typeAnalysis.forEach((item) => {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = {
          machineCount: 0,
          maintenanceCount: 0,
          documentCount: 0,
        };
      }
      categoryStats[item.category].machineCount += item.machineCount;
      categoryStats[item.category].maintenanceCount += item.totalMaintenances;
      categoryStats[item.category].documentCount += item.totalDocuments;
    });

    return {
      byType: typeAnalysis,
      byCategory: categoryStats,
    };
  }

  async getMachineHealth() {
    // Get all machines with their maintenance counts
    const machines = await this.prisma.machine.findMany({
      include: {
        maintenances: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        documents: true,
        type: {
          select: {
            name: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: { maintenances: true },
        },
      },
    });

    const now = new Date();

    const healthData = machines.map((machine) => {
      const lastMaintenance = machine.maintenances[0];
      const daysSinceLastMaintenance = lastMaintenance
        ? Math.floor(
            (now.getTime() - new Date(lastMaintenance.date).getTime()) / (1000 * 60 * 60 * 24),
          )
        : null;

      // Calculate health score (0-100)
      let healthScore = 100;
      if (!lastMaintenance) {
        healthScore = 50; // No maintenance history
      } else if (daysSinceLastMaintenance && daysSinceLastMaintenance > 180) {
        healthScore = 30; // Critical - no maintenance for 6+ months
      } else if (daysSinceLastMaintenance && daysSinceLastMaintenance > 90) {
        healthScore = 60; // Warning - no maintenance for 3+ months
      } else {
        healthScore = 100 - (daysSinceLastMaintenance || 0) / 2; // Gradual decrease
      }

      // Determine status
      let status: 'excellent' | 'good' | 'warning' | 'critical';
      if (healthScore >= 80) status = 'excellent';
      else if (healthScore >= 60) status = 'good';
      else if (healthScore >= 40) status = 'warning';
      else status = 'critical';

      return {
        machineId: machine.id,
        serialNumber: machine.serialNumber,
        description: machine.description,
        typeName: machine.type?.name || 'Non specificato',
        categoryName: machine.type?.category?.name || 'Non categorizzato',
        totalMaintenances: machine._count.maintenances,
        totalDocuments: machine.documents.length,
        lastMaintenanceDate: lastMaintenance?.date || null,
        daysSinceLastMaintenance,
        healthScore: Math.round(healthScore),
        status,
      };
    });

    // Summary statistics
    const summary = {
      excellent: healthData.filter((m) => m.status === 'excellent').length,
      good: healthData.filter((m) => m.status === 'good').length,
      warning: healthData.filter((m) => m.status === 'warning').length,
      critical: healthData.filter((m) => m.status === 'critical').length,
    };

    // Machines needing attention (warning or critical)
    const needsAttention = healthData
      .filter((m) => m.status === 'warning' || m.status === 'critical')
      .sort((a, b) => a.healthScore - b.healthScore)
      .slice(0, 10);

    return {
      summary,
      machines: healthData,
      needsAttention,
    };
  }
}
