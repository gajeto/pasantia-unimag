import numpy as np
from pandas import read_csv
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score, RepeatedKFold
from sklearn.metrics import mean_squared_error, accuracy_score
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, MinMaxScaler
from sklearn.compose import ColumnTransformer
import matplotlib.pyplot as plt

dataf = read_csv('datos.csv', header=None)
data = dataf.values
X = data[:, :-1]
Y = data[:, -1]
#print(X.shape, Y.shape)


t = [('num', MinMaxScaler(), [1,2,3,6,7,10,12,13]), ('cat', OneHotEncoder(), [0,4,5,8,9,11,14,15])]
transformer = ColumnTransformer(transformers=t)
X = transformer.fit_transform(X)
#print(X)
label_encoder = LabelEncoder()
Y = label_encoder.fit_transform(Y)

xtrain, xtest, ytrain, ytest=train_test_split(X,Y, test_size=0.2)

xgbr = xgb.XGBRegressor(verbosity=0)

xgbr.fit(xtrain, ytrain)

score = xgbr.score(xtrain, ytrain)
print("Training score: ", score)

cv = RepeatedKFold(n_splits=10, n_repeats=3, random_state=1)
# evaluate model
scores = cross_val_score(xgbr, xtrain, ytrain, scoring='neg_mean_absolute_error', cv=cv, n_jobs=-1)
# force scores to be positive
scores = np.absolute(scores)
print('Mean MAE: %.3f (%.3f)' % (scores.mean(), scores.std()) )

ypred = xgbr.predict(xtest)

mse = mean_squared_error(ytest, ypred)
rmse = mean_squared_error(ytest, ypred, squared=False)
print("MSE: %.2f" % mse)
print("RMSE: %.2f" % rmse)

predictions = [round(value) for value in ypred]
# evaluate predictions
accuracy = accuracy_score(ytest, predictions)
print("Accuracy: %.2f%%" % (accuracy * 100.0))

x_ax = range(len(ytest))
plt.plot(x_ax, ytest, label="original")
plt.plot(x_ax, ypred, label="predicted")
plt.title("Obesity levels test and predicted data")
plt.legend()
plt.show()

fig, ax = plt.subplots()
ax.scatter(ytest, ypred)
ax.plot([ytest.min(), ytest.max()], [ytest.min(), ytest.max()], 'k--', lw=4)
ax.set_xlabel('Measured')
ax.set_ylabel('Predicted')
plt.show()