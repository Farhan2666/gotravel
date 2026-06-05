import { Response } from 'express';
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getVehiclesByRoute,
  getDriverVehicles,
} from '../config/dbHelper';
import { AuthRequest } from '../middlewares/auth';

export async function addVehicle(req: AuthRequest, res: Response) {
  try {
    const role = req.user?.role;
    if (role !== 'admin' && role !== 'driver') {
      return res.status(403).json({ error: 'Hanya admin dan driver yang bisa menambah kendaraan' });
    }
    const data = { ...req.body };
    if (role === 'driver') {
      data.driver_id = req.user?.id;
    }
    const vehicle = await createVehicle(data);
    res.status(201).json({ message: 'Kendaraan berhasil ditambahkan', vehicle });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function listVehicles(req: AuthRequest, res: Response) {
  try {
    const { from, to } = req.query;
    let vehicles;
    if (from && to) {
      vehicles = await getVehiclesByRoute(from as string, to as string);
    } else {
      vehicles = await getAllVehicles();
    }
    res.json(vehicles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getVehicle(req: AuthRequest, res: Response) {
  try {
    const vehicle = await getVehicleById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Kendaraan tidak ditemukan' });
    res.json(vehicle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function editVehicle(req: AuthRequest, res: Response) {
  try {
    const role = req.user?.role;
    const vehicle = await getVehicleById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Kendaraan tidak ditemukan' });
    if (role !== 'admin' && vehicle.driver_id !== req.user?.id) {
      return res.status(403).json({ error: 'Tidak punya akses' });
    }
    const updated = await updateVehicle(req.params.id, req.body);
    res.json({ message: 'Kendaraan diupdate', vehicle: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function removeVehicle(req: AuthRequest, res: Response) {
  try {
    const role = req.user?.role;
    const vehicle = await getVehicleById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Kendaraan tidak ditemukan' });
    if (role !== 'admin' && vehicle.driver_id !== req.user?.id) {
      return res.status(403).json({ error: 'Tidak punya akses' });
    }
    await deleteVehicle(req.params.id);
    res.json({ message: 'Kendaraan dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function myVehicles(req: AuthRequest, res: Response) {
  try {
    const driverId = req.user?.id;
    if (!driverId) return res.status(401).json({ error: 'Unauthorized' });
    const vehicles = await getDriverVehicles(driverId);
    res.json(vehicles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
