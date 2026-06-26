import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api.js';

export function useUpdateRecord(module) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data, persons, properties }) => {
      const res = await api.put(`/records/${id}`, {
        data,
        ...(persons !== undefined && { persons }),
        ...(properties !== undefined && { properties }),
      });
      return res.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['records', variables.id] });
    }
  });
}
