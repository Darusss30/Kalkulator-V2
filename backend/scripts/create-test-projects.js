const db = require('../config/database');

async function createTestProjects() {
  
  try {
    // Test projects data
    const testProjects = [
      {
        project_name: 'Rumah Pak Budi',
        calculations: [
          { job_type_id: 1, volume: 150, labor_cost: 855000, material_cost: 200000 },
          { job_type_id: 4, volume: 50, labor_cost: 400000, material_cost: 800000 },
          { job_type_id: 7, volume: 100, labor_cost: 600000, material_cost: 1500000 }
        ]
      },
      {
        project_name: 'Kantor PT ABC',
        calculations: [
          { job_type_id: 2, volume: 200, labor_cost: 1200000, material_cost: 300000 },
          { job_type_id: 5, volume: 80, labor_cost: 800000, material_cost: 1200000 },
          { job_type_id: 8, volume: 120, labor_cost: 900000, material_cost: 2000000 }
        ]
      },
      {
        project_name: 'Ruko Jalan Merdeka',
        calculations: [
          { job_type_id: 3, volume: 75, labor_cost: 500000, material_cost: 400000 },
          { job_type_id: 6, volume: 60, labor_cost: 700000, material_cost: 1000000 }
        ]
      }
    ];

    // Get admin user
    const adminUser = await db.getOne('SELECT id FROM users WHERE username = ?', ['admin']);
    if (!adminUser) {
      return;
    }


    // Insert calculations for each project
    for (const project of testProjects) {
      
      for (const calc of project.calculations) {
        const totalHPP = calc.labor_cost + calc.material_cost;
        const profitPercentage = 20.0;
        const rabTotal = Math.round(totalHPP / (1 - profitPercentage / 100));
        const hppPerUnit = Math.round(totalHPP / calc.volume);
        
        const calculationData = {
          job_type: { id: calc.job_type_id, name: `Job Type ${calc.job_type_id}` },
          input: { 
            volume: calc.volume, 
            productivity: 100,
            profit_percentage: profitPercentage,
            project_name: project.project_name
          },
          labor: {
            total_labor_cost: calc.labor_cost
          },
          materials: {
            total_material_cost: calc.material_cost
          },
          summary: { 
            total_labor_cost: calc.labor_cost,
            total_material_cost: calc.material_cost,
            total_cost: totalHPP,
            hpp_per_unit: hppPerUnit,
            rab_total: rabTotal,
            profit_percentage: profitPercentage,
            profit_amount: rabTotal - totalHPP
          }
        };

        const insertId = await db.insert(`
          INSERT INTO calculations (
            user_id, job_type_id, volume, productivity, worker_ratio, num_workers,
            labor_cost, material_cost, hpp_per_unit, total_rab, estimated_days, calculation_data,
            profit_percentage, rab_total, project_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          adminUser.id,
          calc.job_type_id,
          calc.volume,
          100, // productivity
          '1:1', // worker_ratio
          4, // num_workers
          calc.labor_cost,
          calc.material_cost,
          hppPerUnit,
          rabTotal, // total_rab
          Math.ceil(calc.volume / 100), // estimated_days
          JSON.stringify(calculationData),
          profitPercentage,
          rabTotal,
          project.project_name
        ]);

      }
    }

    // Verify the data
    const projects = await db.getMany(`
      SELECT 
        project_name,
        COUNT(*) as calculation_count,
        SUM(rab_total) as total_value,
        MAX(created_at) as last_updated
      FROM calculations 
      WHERE project_name IS NOT NULL 
      GROUP BY project_name
      ORDER BY last_updated DESC
    `);

    projects.forEach(project => {
    });

    
  } catch (error) {
  } finally {
    process.exit(0);
  }
}

// Run the script
createTestProjects();
