/**
 * Demo data generator for testing migration
 */

import { offlineService } from './offline-db';

const demoAircraft = [
  {
    registration: 'PT-ABC',
    model: 'Cessna 172',
    manufacturer: 'Cessna',
    status: 'active' as const,
    last_inspection: '2024-01-15',
    flight_hours: 1250
  },
  {
    registration: 'PT-XYZ', 
    model: 'Piper Cherokee',
    manufacturer: 'Piper',
    status: 'maintenance' as const,
    last_inspection: '2024-01-10',
    flight_hours: 890
  }
];

const demoEmployees = [
  {
    name: 'Maria Santos',
    email: 'maria@aviation.com',
    role: 'Piloto Comercial',
    certifications: ['ANAC', 'IFR'],
    hire_date: '2023-06-01',
    status: 'active' as const
  },
  {
    name: 'Carlos Lima',
    email: 'carlos@aviation.com', 
    role: 'Mecânico',
    certifications: ['ANAC Manutenção'],
    hire_date: '2023-08-15',
    status: 'active' as const
  }
];

/**
 * Populate offline database with demo data
 */
export async function populateDemoData(): Promise<void> {
  try {
    console.log('Populating demo data...');

    // Add demo aircraft
    for (const aircraft of demoAircraft) {
      await offlineService.aircraft.create(aircraft);
    }

    // Add demo employees
    for (const employee of demoEmployees) {
      await offlineService.employees.create(employee);
    }

    // Get created aircraft and employees to create relationships
    const [aircraftList, employeesList] = await Promise.all([
      offlineService.aircraft.getAll(),
      offlineService.employees.getAll()
    ]);

    // Add demo tasks
    if (aircraftList.length > 0 && employeesList.length > 0) {
      await offlineService.tasks.create({
        title: 'Inspeção 100h PT-ABC',
        description: 'Inspeção programada de 100 horas',
        assigned_to: employeesList[1].id, // Carlos (Mecânico)
        aircraft_id: aircraftList[0].id,  // PT-ABC
        priority: 'high' as const,
        status: 'pending' as const,
        due_date: '2024-02-01'
      });

      // Add demo flight sheet
      await offlineService.flightSheets.create({
        flight_number: 'AO001',
        aircraft_id: aircraftList[0].id,  // PT-ABC
        pilot_id: employeesList[0].id,    // Maria (Piloto)
        departure_airport: 'SBSP',
        arrival_airport: 'SBRJ', 
        departure_time: '2024-01-20T08:00:00Z',
        arrival_time: '2024-01-20T09:30:00Z',
        flight_hours: 1.5,
        fuel_consumption: 45.5,
        notes: 'Voo de treinamento sem intercorrências',
        status: 'completed' as const
      });
    }

    console.log('Demo data populated successfully');
  } catch (error) {
    console.error('Failed to populate demo data:', error);
    throw error;
  }
}

/**
 * Clear all offline data
 */
export async function clearOfflineData(): Promise<void> {
  try {
    const [aircraftList, employeesList, tasksList, flightSheetsList] = await Promise.all([
      offlineService.aircraft.getAll(),
      offlineService.employees.getAll(), 
      offlineService.tasks.getAll(),
      offlineService.flightSheets.getAll()
    ]);

    // Delete all records
    for (const aircraft of aircraftList) {
      await offlineService.aircraft.delete(aircraft.id);
    }

    for (const employee of employeesList) {
      await offlineService.employees.delete(employee.id);
    }

    for (const task of tasksList) {
      await offlineService.tasks.delete(task.id);
    }

    for (const flightSheet of flightSheetsList) {
      await offlineService.flightSheets.delete(flightSheet.id);
    }

    console.log('Offline data cleared successfully');
  } catch (error) {
    console.error('Failed to clear offline data:', error);
    throw error;
  }
}

/**
 * Get offline data summary
 */
export async function getOfflineDataSummary() {
  try {
    const [aircraft, employees, tasks, flightSheets] = await Promise.all([
      offlineService.aircraft.getAll(),
      offlineService.employees.getAll(),
      offlineService.tasks.getAll(), 
      offlineService.flightSheets.getAll()
    ]);

    return {
      aircraft: aircraft.length,
      employees: employees.length,
      tasks: tasks.length,
      flightSheets: flightSheets.length,
      total: aircraft.length + employees.length + tasks.length + flightSheets.length
    };
  } catch (error) {
    console.error('Failed to get offline data summary:', error);
    return { aircraft: 0, employees: 0, tasks: 0, flightSheets: 0, total: 0 };
  }
}
