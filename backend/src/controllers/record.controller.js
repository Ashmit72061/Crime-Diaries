import { Record } from '../models/Record.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const createRecord = asyncHandler(async (req, res) => {
  const { recordType, data, policeStation, district } = req.body;
  if (!recordType || !data || !policeStation || !district) {
    throw new ApiError(400, 'All fields are required');
  }

  const record = await Record.create({
    recordType,
    data,
    policeStation,
    district,
    createdBy: req.user.id,
  });

  return res.status(201).json(new ApiResponse(201, record, 'Record created successfully'));
});

export const getRecords = asyncHandler(async (req, res) => {
  const { recordType } = req.query;
  
  // Build dynamic query filters
  const filter = {};
  if (recordType) {
    filter.recordType = recordType;
  }

  // Hierarchy role filtering based on request headers
  const activeRole = req.headers['x-active-role'];
  const activeStation = req.headers['x-active-station'];
  const activeDistrict = req.headers['x-active-district'];

  if (activeRole === 'PS' && activeStation) {
    filter.policeStation = activeStation;
  } else if (activeRole === 'DISTRICT' && activeDistrict) {
    filter.district = activeDistrict;
  } else if (activeRole === 'ZONE' || activeRole === 'RANGE') {
    if (activeDistrict) {
      filter.district = activeDistrict;
    }
  }

  // Apply query filters if explicitly requested and compatible
  if (req.query.district && !filter.district) {
    filter.district = req.query.district;
  }
  if (req.query.policeStation && !filter.policeStation) {
    filter.policeStation = req.query.policeStation;
  }

  // Text search query
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    filter.$or = [
      { 'data.firNumber': searchRegex },
      { 'data.firDdNumber': searchRegex },
      { 'data.ddNumber': searchRegex },
      { 'data.fullName': searchRegex },
      { 'data.name': searchRegex },
      { 'data.complainantName': searchRegex },
      { 'data.ioName': searchRegex },
    ];
  }

  const records = await Record.find(filter).sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, records, 'Records retrieved successfully'));
});

export const getRecordById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const record = await Record.findById(id);
  if (!record) {
    throw new ApiError(404, 'Record not found');
  }
  return res.status(200).json(new ApiResponse(200, record, 'Record retrieved successfully'));
});

export const updateRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data } = req.body;

  const record = await Record.findById(id);
  if (!record) {
    throw new ApiError(404, 'Record not found');
  }

  record.data = { ...record.data, ...data };
  await record.save();

  return res.status(200).json(new ApiResponse(200, record, 'Record updated successfully'));
});

export const deleteRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const record = await Record.findById(id);
  if (!record) {
    throw new ApiError(404, 'Record not found');
  }

  await Record.findByIdAndDelete(id);
  return res.status(200).json(new ApiResponse(200, null, 'Record deleted successfully'));
});
