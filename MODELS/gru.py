import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

from math import sqrt
from numpy import concatenate
from matplotlib import pyplot
from sklearn.metrics import mean_squared_error
from keras.models import Sequential
from keras.layers import Dense, GRU
from tensorflow import keras


class evalGRU:
    def __init__(self, data, scaler, sampleSize, epochs, units):
        self.data = data
        self.scaler = scaler
        self.sampleSize = sampleSize
        self.epochs = epochs
        self.units = units
        self.trainX, self.trainY, self.testX, self.testY = self.splitDataset(self.data, self.sampleSize)

    def splitDataset(self, data,sampleSize):
        # split into train and test sets
        # sampleSize = 400
        train = data[:sampleSize, :]
        test = data[sampleSize:, :]
        # split into input and outputs
        trainX, trainY = train[:, :-1], train[:, -1]
        testX, testY = test[:, :-1], test[:, -1]
        # reshape input to be 3D [samples, timesteps, features]
        trainX = trainX.reshape((trainX.shape[0], 1, trainX.shape[1]))
        testX = testX.reshape((testX.shape[0], 1, testX.shape[1]))
        print(trainX.shape, trainY.shape, testX.shape, testY.shape)

        return trainX, trainY, testX, testY

    def modelGRU(self):

        # design network
        model = Sequential()
        model.add(GRU(self.units, input_shape=(self.trainX.shape[1], self.trainX.shape[2])))
        model.add(Dense(1))
        opt = keras.optimizers.Adam(learning_rate=0.0001)
        model.compile(loss='mae', optimizer=opt)
        # fit network
        history = model.fit(self.trainX, self.trainY, epochs=self.epochs, batch_size=2, validation_data=(self.testX, self.testY), verbose=2,
                            shuffle=False)
        # plot history
        pyplot.title('GRU Loss')
        pyplot.plot(history.history['loss'], label='loss train')
        pyplot.plot(history.history['val_loss'], label='loss test')
        pyplot.legend()
        pyplot.show()
        return model

    def forecast(self):
        model = self.modelGRU()
        # make a prediction
        yhat = model.predict(self.testX)
        testX = self.testX.reshape((self.testX.shape[0], self.testX.shape[2]))

        # invert scaling for forecast
        predicted = concatenate((yhat, testX[:, 1:]), axis=1)
        predicted = self.scaler.inverse_transform(predicted)
        predicted = predicted[:, 0]
        # invert scaling for actual
        testY = self.testY.reshape((len(self.testY), 1))
        actual = concatenate((testY, testX[:, 1:]), axis=1)
        actual = self.scaler.inverse_transform(actual)
        actual = actual[:, 0]

        # pyplot.plot(actual, label='actual')
        # pyplot.plot(predicted, label='predicted')
        # pyplot.title('GRU')
        # pyplot.xlabel('Days')
        # pyplot.ylabel('Confirmed cases')
        # pyplot.legend()
        #pyplot.show()
        # calculate RMSE
        rmse = sqrt(mean_squared_error(actual, predicted))
        #print("Accuracy: %.2f%%" % (accuracy * 100.0))
        print('Test RMSE: %.3f' % rmse)
        return predicted