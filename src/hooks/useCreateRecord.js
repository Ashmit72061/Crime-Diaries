import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api.js';

export function useCreateRecord(module) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const record_date = formData.record_date || new Date().toISOString().split('T')[0];
      const res = await api.post('/records', {
        record_type: module,
        record_date,
        data: formData
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
    }
  });
}
