import Card from './Card';

const CSVUploadResultModal = ({ result, onClose }) => {
  if (!result) return null;

  const { inserted, updated, errors, totalProcessed } = result.summary || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" title="CSV Upload Results">
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{inserted || 0}</p>
              <p className="text-sm text-gray-600">Inserted</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{updated || 0}</p>
              <p className="text-sm text-gray-600">Updated</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{totalProcessed || 0}</p>
              <p className="text-sm text-gray-600">Total Processed</p>
            </div>
          </div>

          {/* Errors */}
          {errors && errors.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-red-600 mb-2">
                Errors ({errors.length})
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {errors.map((error, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xs font-semibold text-red-800">
                      Row {error.row}: {error.error}
                    </p>
                    {error.data && (
                      <p className="text-xs text-gray-600 mt-1">
                        Data: {JSON.stringify(error.data)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          {(!errors || errors.length === 0) && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✓ CSV upload completed successfully!
              </p>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CSVUploadResultModal;

