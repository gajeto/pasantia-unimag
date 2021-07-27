def decoration_function(function_to_be_decorated):
    def test_2():
        print("Decorated your function")
        function_to_be_decorated()

    return test_2


@decoration_function
def test_1():
    if 1:
        print("Hello World f")


test_1()
