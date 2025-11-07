/**
 * Price Management Component (Admin Only)
 *
 * Admin UI for managing price items with version history
 * Features:
 * - Editable price grid
 * - Add/update/remove items
 * - Version history view
 * - Auto-save on edit
 */

import { useEffect, useState } from 'react';
import { usePrices } from './usePrices';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Card } from '../../shared/components/Card';
import { Modal } from '../../shared/components/Modal';

interface EditingItem {
  id: string;
  price: string;
  unit: string;
  notes: string;
}

export function PriceManagement() {
  const {
    activePriceSheet,
    history,
    loading,
    error,
    fetchActive,
    fetchHistory,
    updateItem,
    addItem,
    removeItem,
    toggleHistory,
    showHistory,
    clearError,
  } = usePrices();

  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', unit: '', notes: '' });

  // Load active price sheet on mount
  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  const handleStartEdit = (item: { id: string; price: number; unit: string; notes?: string }) => {
    setEditingItem({
      id: item.id,
      price: item.price.toString(),
      unit: item.unit,
      notes: item.notes || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      await updateItem(editingItem.id, {
        price: parseFloat(editingItem.price),
        unit: editingItem.unit,
        notes: editingItem.notes || undefined,
      });
      setEditingItem(null);
    } catch (err) {
      // Error is handled by the store
      console.error('Failed to update item:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.unit) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await addItem({
        name: newItem.name,
        price: parseFloat(newItem.price),
        unit: newItem.unit,
        last_checked: new Date(),
        notes: newItem.notes || undefined,
      });
      setShowAddModal(false);
      setNewItem({ name: '', price: '', unit: '', notes: '' });
    } catch (err) {
      // Error is handled by the store
      console.error('Failed to add item:', err);
    }
  };

  const handleRemoveItem = async (id: string, name: string) => {
    if (
      confirm(
        `Are you sure you want to remove "${name}"? This will create a new price sheet version.`,
      )
    ) {
      try {
        await removeItem(id);
      } catch (err) {
        // Error is handled by the store
        console.error('Failed to remove item:', err);
      }
    }
  };

  const handleShowHistory = () => {
    if (!showHistory && history.length === 0) {
      fetchHistory();
    }
    toggleHistory();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Price Management</h1>
              {activePriceSheet && (
                <p className="text-sm text-gray-600 mt-1">
                  Version {activePriceSheet.version} •{' '}
                  {new Date(activePriceSheet.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleShowHistory}>
                {showHistory ? 'Hide History' : 'View History'}
              </Button>
              <Button variant="primary" onClick={() => setShowAddModal(true)}>
                + Add Item
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <p className="text-red-800 text-sm">{error}</p>
                <button onClick={clearError} className="text-red-600 hover:text-red-800">
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* History View */}
        {showHistory && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Version History</h2>
            {loading && <p className="text-gray-600">Loading history...</p>}
            {history.length > 0 && (
              <div className="space-y-2">
                {history.map((sheet) => (
                  <div
                    key={sheet.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <span className="font-medium">Version {sheet.version}</span>
                      <span className="text-sm text-gray-600 ml-4">
                        {new Date(sheet.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Price Items Table */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Price Items</h2>

          {loading && !activePriceSheet && <p className="text-gray-600">Loading prices...</p>}

          {activePriceSheet && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 font-semibold text-gray-700">Name</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Price</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Unit</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Notes</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activePriceSheet.items.map((item) => {
                    const isEditing = editingItem?.id === item.id;
                    return (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 font-medium">{item.name}</td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editingItem.price}
                              onChange={(e) =>
                                setEditingItem({ ...editingItem, price: e.target.value })
                              }
                              className="w-32"
                              step="0.01"
                            />
                          ) : (
                            `$${item.price.toFixed(2)}`
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              type="text"
                              value={editingItem.unit}
                              onChange={(e) =>
                                setEditingItem({ ...editingItem, unit: e.target.value })
                              }
                              className="w-32"
                            />
                          ) : (
                            item.unit
                          )}
                        </td>
                        <td className="p-3 text-gray-600 text-sm">
                          {isEditing ? (
                            <Input
                              type="text"
                              value={editingItem.notes}
                              onChange={(e) =>
                                setEditingItem({ ...editingItem, notes: e.target.value })
                              }
                              className="w-48"
                            />
                          ) : (
                            item.notes || '-'
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="small"
                                variant="primary"
                                onClick={handleSaveEdit}
                                disabled={loading}
                              >
                                Save
                              </Button>
                              <Button size="small" variant="secondary" onClick={handleCancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="small"
                                variant="secondary"
                                onClick={() => handleStartEdit(item)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                variant="tertiary"
                                onClick={() => handleRemoveItem(item.id, item.name)}
                                disabled={loading}
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activePriceSheet && activePriceSheet.items.length === 0 && (
            <p className="text-gray-600 text-center py-8">
              No price items yet. Click "Add Item" to get started.
            </p>
          )}
        </Card>

        {/* Add Item Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Price Item">
          <div className="space-y-4">
            <Input
              label="Item Name"
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="e.g., Road Base"
              required
            />
            <Input
              label="Price"
              type="number"
              value={newItem.price}
              onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
              placeholder="0.00"
              step="0.01"
              required
            />
            <Input
              label="Unit"
              type="text"
              value={newItem.unit}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              placeholder="e.g., per m³, per load"
              required
            />
            <Input
              label="Notes (optional)"
              type="text"
              value={newItem.notes}
              onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
              placeholder="Additional information"
            />
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddItem} disabled={loading}>
                Add Item
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
