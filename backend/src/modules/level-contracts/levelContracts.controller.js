import * as levelContractsService from './levelContracts.service.js';
import { publish } from '../../events/eventBus.js';

export const listContracts = async (req, res) => {
  try {
    const contracts = await levelContractsService.getContracts();
    return res.status(200).json({ status: 'success', data: contracts });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const create = async (req, res) => {
  const { from_level, to_level, record_type, visible_field_keys, aggregate_definitions, route, is_active } = req.body;

  if (!from_level || !to_level) {
    return res.status(400).json({ status: 'error', message: 'from_level and to_level are required' });
  }

  try {
    const contract = await levelContractsService.createContract({
      from_level,
      to_level,
      record_type,
      visible_field_keys,
      aggregate_definitions,
      route,
      is_active
    });

    // publish admin config changed event
    await publish('admin.config_changed', {
      entity_type: 'LEVEL_DATA_CONTRACT',
      entity_id: contract.id,
      action: 'CREATE',
      changed_by: req.user ? (req.user.userId || req.user.id) : null,
      changes: contract
    });

    return res.status(201).json({ status: 'success', data: contract });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const update = async (req, res) => {
  const { id } = req.params;

  try {
    const contract = await levelContractsService.updateContract(id, req.body);
    if (!contract) {
      return res.status(404).json({ status: 'error', message: 'Contract not found' });
    }

    // publish admin config changed event
    await publish('admin.config_changed', {
      entity_type: 'LEVEL_DATA_CONTRACT',
      entity_id: id,
      action: 'UPDATE',
      changed_by: req.user ? (req.user.userId || req.user.id) : null,
      changes: req.body
    });

    return res.status(200).json({ status: 'success', data: contract });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
